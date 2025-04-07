require('dotenv').config()
const express = require("express");
const app = express();
const port = process.env.PORT || 9000;
const cors = require("cors");


// middleware
app.use(express.json());
app.use(cors());



app.get("/",(req,res)=>{
    res.send("Hello from the server side")
})
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.p7zpg.mongodb.net/?appName=Cluster1`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const db = client.db("service-db");
    const serviceCollection = db.collection("services");



    // get the services
     
    app.get("/services",async(req,res)=>{
        const result = await serviceCollection.find().toArray();
        res.send(result);
    })

    app.get("/service/:id",async(req,res)=>{
        const id = req.params.id;
        const query = {_id:new ObjectId(id)};
        const result = await serviceCollection.findOne(query);
        res.send(result);
    })

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port,()=>{
    console.log(`listening from port : ${port}`)
})

