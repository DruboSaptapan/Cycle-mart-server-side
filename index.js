const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
require('dotenv').config()

const app = express();
const port = process.env.PORT || 7000;

// MiddleWare
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b5wnr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        // Connect to database
        await client.connect();
        // console.log('database connected')
        const database = client.db("cycle_mart")
        const productsCollection = database.collection("products")
        const ordersCollection = database.collection("orders")
        const reviewsCollection = database.collection("reviews")
        const usersCollection = database.collection('users');

        // Get Products API
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const packages = await cursor.toArray();
            res.send(packages);
        })

        // Add Product API
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.json(result);
        })

        // Get Single Package
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const package = await productsCollection.findOne(query);
            res.json(package);
        })

        // Add Orders API
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.json(result);
        })

        // Get Orders API
        app.get('/orders', async (req, res) => {
            const cursor = ordersCollection.find({});
            const orders = await cursor.toArray();
            res.send(orders);
        })

        // Get MyOrders API
        app.post('/orders/email', async (req, res) => {
            const email = req.body.email;
            const query = { "email": email };
            const result = await ordersCollection.find(query).toArray();
            res.json(result);
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        // upsert for users list in mongodb database
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        })

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })
        })

        /* Add orders api */
        app.post('/reviews', async (req, res) => {
            const reviews = req.body;
            const result = await reviewsCollection.insertOne(reviews);
            res.json(result);
        })

        // order update status
      app.post('/updateStatus', async (req, res) => {
        const id = req.body.id;
        const status = req.body.status;

        const filter = { _id: ObjectId(id) }
        const options = { upsert: true };
        const updateStatus =  {
            $set: {
              "status": status === 'pending' ? 'approved ' : 'pending'
            },
          };

        const result = await ordersCollection.updateOne(filter, updateStatus, options);
        console.log('database hited', result);
        res.json(result);
      })

        /* Get reviews api */
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        // Delete Orders API
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
        })
    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Cycle Mart website mongo server')
});


app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`)
})