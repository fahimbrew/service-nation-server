require('dotenv').config()
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 9000;
const cors = require("cors");


// middleware
app.use(express.json());
app.use(cors({
    origin:["http://localhost:5173"],
    credentials:true
}));
app.use(cookieParser());

// verify token

const verifyToken = (req,res,next)=>{
    const token = req.cookies?.token;
    // console.log(token);
    if(!token) return res.status(401).send({message:"Unauthorized access"})
      jwt.verify(token,process.env.SECRET_KEY,(err,decoded)=>{
          if(err){
            return res.status(401).send({message:"Unauthorized access"})
          } 
          req.user = decoded;
      })
    next();
  }

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
    const bookingCollection = db.collection("bookings");


    // jwt token

    app.post("/jwt",(req,res)=>{
        const user = req.body;
        const token = jwt.sign(user,process.env.SECRET_KEY,{expiresIn:"5hr"});
        res
        .cookie("token",token,{
            httpOnly:true,
            secure:process.env.NODE_ENV ==="production",
            sameSite:process.env.NODE_ENV === "production" ? "none":"strict"
        })
        .send({success:true})
    })

    // logout user and expire token
    app.get("/logout",(req,res)=>{
        res
        .clearCookie("token",{
          maxAge:0,
          secure:process.env.NODE_ENV ==="production",
          sameSite:process.env.NODE_ENV === "production" ? "none":"strict"
        })
        .send({success:true})
    })

    // get the services
     
    app.get("/services",async(req,res)=>{
        const result = await serviceCollection.find().toArray();
        res.send(result);
    })

    // get single service details
    app.get("/service/:id",verifyToken,async(req,res)=>{
        const id = req.params.id;
        const query = {_id:new ObjectId(id)};
        const result = await serviceCollection.findOne(query);
        res.send(result);
    })

     // add a service

   app.post("/services",async(req,res)=>{
    const services = req.body;
    const result = await serviceCollection.insertOne(services);
    res.send(result);
   })

   // get services for a specific user for manage crud

   app.get("/services/user/:email",verifyToken, async (req, res) => {
    const decodedEmail = req.user?.email;
    const { email } = req.params;
    if(decodedEmail!==email) return res.status(401).send({message:"Unauthorized access"});
    const userServices = await serviceCollection.find({ serviceProviderEmail: email }).toArray();
    res.send(userServices);
  });

  // delete a service

  app.delete("/service/:id",verifyToken,async(req,res)=>{
    const id = req.params.id;
    const query = {_id:new ObjectId(id)};
    const result = await serviceCollection.deleteOne(query);
    res.send(result);
  })

  // server.js or routes/service.js
  app.put("/service/:id",verifyToken, async (req, res) => {
    try {
      const id = req.params.id;
      const serviceData = req.body;
  
      // Ensure serviceLocation is not undefined
      if (!serviceData.serviceLocation) {
        return res.status(400).json({ message: "Service location is required." });
      }
  
      const result = await serviceCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            serviceName: serviceData.serviceName,
            serviceDescription: serviceData.serviceDescription,
            servicePrice: serviceData.servicePrice,
            serviceImage: serviceData.serviceImage,
            serviceLocation: serviceData.serviceLocation,
          },
        }
      );
  
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Service not found" });
      }
  
      res.status(200).json({ message: "Service updated successfully" });
    } catch (error) {
      console.error("🚨 Error in PUT /service/:id:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  });

  // Get bookings where serviceProviderEmail matches logged-in user
app.get("/bookings/provider/:email", async (req, res) => {
    try {
      const result = await bookingCollection
        .find({ userEmail: req.params.email })
        .toArray();
      res.send(result);
    } catch (err) {
      res.status(500).send({ error: "Server Error" });
    }
  });
  
  // Update status of a booking
  app.patch("/bookings/status/:id",verifyToken, async (req, res) => {
    const { id } = req.params;
    const { serviceStatus } = req.body;
  
    try {
      const result = await bookingCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            serviceStatus,
          },
        }
      );
      res.send(result);
    } catch (err) {
      res.status(500).send({ error: "Failed to update status" });
    }
  });
  
  
  



    // save booking Data

    app.post("/bookings",async(req,res)=>{
        const bookings = req.body;
        const result = await bookingCollection.insertOne(bookings);
        res.send(result);
    })

    // get bookings for a user

    app.get("/bookings/:email", async (req, res) => {
        try {
          const userEmail = req.params.email;
      
          if (!userEmail) {
            return res.status(400).json({ error: "User email is required" });
          }
      
          const userBookings = await bookingCollection
            .find({ userEmail })
            .sort({ serviceTakingDate: -1 })
            .toArray();
      
          res.status(200).json(userBookings);
        } catch (err) {
          console.error("Error fetching bookings:", err);
          res.status(500).json({ error: "Server error" });
        }
      });

     

      

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

