const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("my-portfolio");
    const services = db.collection("services");
    const skills = db.collection("skills");
    const projects = db.collection("projects");
    const projectDetails = db.collection("projectDetails");
    const social = db.collection("social");

    app.get("/services", async (req, res) => {
      const result = await services.find({}).toArray();
      res.send({
        success: true,
        message: "services fetched successfully.",
        data: result,
      });
    });

    app.get("/skills", async (req, res) => {
      const result = await skills.find({}).toArray();
      res.send({
        success: true,
        message: "Skills fetched successfully.",
        data: result,
      });
    });

    // create project
    app.post("/project", async (req, res) => {
      const projectData = req.body;

      const project = {
        title: projectData.title,
        live: projectData.live,
        image: projectData.image,
      };

      const createProject = await projects.insertOne(project);

      if (!createProject.insertedId) {
        res.send({
          success: false,
          message: "Something went wrong while creating project.",
        });
      }

      const projectDetail = {
        projectId: createProject.insertedId,
        description: projectData.description,
        code: projectData.code,
        features: projectData.features,
        technology: projectData.technology,
        images: projectData.images,
      };

      const result = await projectDetails.insertOne(projectDetail);
      res.send({
        success: true,
        message: "Projects created successfully.",
        data: result,
      });
    });

    // get all project
    app.get("/projects", async (req, res) => {
      const result = await projects.find({}).toArray();
      res.send({
        success: true,
        message: "Projects fetched successfully.",
        data: result,
      });
    });

    // project details
    app.get("/project/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { projectId: new ObjectId(id) };
      const project = await projects.findOne({ _id: new ObjectId(id) });
      const productDetail = await projectDetails.findOne(query);

      const result = { ...project, ...productDetail };
      res.send({
        success: true,
        message: "Project details fetched successfully.",
        data: result,
      });
    });

    app.get("/social-links", async (req, res) => {
      const result = await social.find({}).toArray();
      res.send({
        success: true,
        message: "Social link fetched successfully.",
        data: result,
      });
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
