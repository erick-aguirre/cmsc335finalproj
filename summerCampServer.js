"use strict"

const http = require("http");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') }) 
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const app = express(); 
process.stdin.setEncoding("utf8");
let json;
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

if (process.argv.length != 3) {
    process.stdout.write("Usage summerCampServer.js portNumber\n");
    process.exit(1);
}
const portNumber = 10000;
const databaseAndCollection = {db: "CMSC335_DB", collection:"campApplicants"};
const { MongoClient, ServerApiVersion } = require('mongodb');


async function main() {
    const uri = `mongodb+srv://${userName}:${password}@cimmanonroll.2xbkwdj.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function insertApp(client, databaseAndCollection, newApp) {
    await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newApp);
}

async function deleteApps(client, databaseAndCollection) {
    const result = await client.db(databaseAndCollection.db)
                   .collection(databaseAndCollection.collection)
                   .deleteMany();
    
    return result.deletedCount;
}

async function findGPA(client, databaseAndCollection, gpaNum) {
    let filter = {gpa: {$gte:gpaNum}};
    const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .find(filter, { projection: { name: 1, gpa: 1} });
    return result.toArray();
}

async function review(client, databaseAndCollection, studentEmail) {
    let filter = {email:studentEmail};
    const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filter);
    return result;
}

const uri = `mongodb+srv://${userName}:${password}@cimmanonroll.2xbkwdj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.get("/", (request, response) => {
    response.render("index");
});

app.get("/apply", (request, response) => {
    const variables = {
        portNum: `${portNumber}`
    };
    response.render("apply", variables);
});

app.get("/adminRemove", (request, response) => {
    const variables = {
        portNum: `${portNumber}`
    };
    response.render("adminRemove", variables);
});

app.get("/adminGFA", (request, response) => {
    const variables = {
        portNum: `${portNumber}`
    };
    response.render("adminGFA", variables);
});

app.get("/reviewApplication", (request, response) => {
    const variables = {
        portNum: `${portNumber}`
    };
    response.render("reviewApplication", variables);
});

app.use(bodyParser.urlencoded({extended:false}));

app.post("/adminRemove", async (request, response) => {
    const num = await deleteApps(client, databaseAndCollection);
    response.render("processAdminRemove", {num});
});

app.post("/apply", async (request, response) => {
    const newApp = {
        name: request.body.name, 
        email: request.body.email, 
        gpa: Number(request.body.gpa), 
        backgroundInfo: request.body.backgroundInfo
    };  
    await insertApp(client, databaseAndCollection, newApp)
    response.render("processApplication", newApp);
});

app.post("/reviewApplication", async (request, response) => {
    const student = await review(client, databaseAndCollection, request.body.email);
    const variables = {
        name: student.name, 
        email: student.email, 
        gpa: student.gpa, 
        backgroundInfo: student.backgroundInfo
    };
    response.render("processReviewApplication", variables);
});

app.post("/adminGFA", async (request, response) => {
    const gpaArr = await findGPA(client, databaseAndCollection, Number(request.body.gpa));
    let table = `<table border="1"><tr><th>Name</th><th>GPA</th></tr>`;
    gpaArr.forEach((student) => {
        table += `<tr><td>${student.name}</td><td>${student.gpa}</td></tr>`;
    });
    table += `</table>`;
    
    const variables = {
        table: `${table}`
    };
    response.render("processAdminGFA", variables);
});

app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);
const prompt = "Type stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
      let command = dataInput.trim();
      if (command === "stop") {
        process.stdout.write("Shutting down the server\n");
        process.exit(0);
      } else {
        process.stdout.write(`Invalid command: ${dataInput}`);
      }
      process.stdout.write(prompt);
      process.stdin.resume();
    }
});

main().catch(console.error);