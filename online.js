const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const { ObjectId } = require('mongodb');


const app = express();
app.use(cors());
const apiToken = "maxim26";

const mongoURL = 'mongodb+srv://iamyathz:Hire123@cluster0.lorwk.mongodb.net/';
const dbName = 'test';
const collectionName = 'Data';

let db;

MongoClient.connect(mongoURL)
    .then(client => {
        db = client.db(dbName);
        console.log("MongoDB connected");
    })
    .catch(err => console.error("MongoDB connection error:", err));

app.get(`/${apiToken}/data`, async (req, res) => {
    try {
        let query = {};
        let limit = 0;
        let skip = 0;

        for (const [field, value] of Object.entries(req.query)) {
            const formattedValue = value.replace(/-/g, ' ');

            if (field === "id") {
                try {
                    query["_id"] = new ObjectId(formattedValue);
                } catch (err) {
                    return res.status(400).json({ error: "Invalid ID format" });
                }

            } else if (field === "Address" || field === "Name") {
                query[field] = { $regex: new RegExp(formattedValue, 'i') };
            } else if (field === "Entries") {
                const entriesRange = value.split('-');
                if (entriesRange.length === 1) {
                    limit = parseInt(entriesRange[0], 10);
                } else if (entriesRange.length === 2) {
                    skip = parseInt(entriesRange[0], 10);
                    limit = parseInt(entriesRange[1], 10) - skip;
                }
            } else if (field === "All") {
                const allValues = value.split('-');
                const andConditions = [];

                allValues.forEach(part => {
                    const formattedPart = part.replace(/_/g, ' ');
                    andConditions.push(
                        {
                            $or: [
                                { Name: { $regex: new RegExp(formattedPart, 'i') } },
                                { Address: { $regex: new RegExp(formattedPart, 'i') } },
                                { Location: { $regex: new RegExp(formattedPart, 'i') } },
                            ]
                        }
                    );
                });

                query.$and = andConditions;
            } else {
                query[field] = formattedValue;
            }
        }

        const results = await db.collection(collectionName)
            .find(query)
            .skip(skip)
            .limit(limit)
            .toArray();

        if (results.length > 0) {
            res.json(results);
        } else {
            res.status(404).json({ error: "No matching data found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

app.get('/', (req, res) => {
    res.send('API is running');
})

app.listen(3000, () => {
    console.log("Server started on port 3000");
});
