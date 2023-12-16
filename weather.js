"use strict"

const http = require("http");
const path = require("path");
require("dotenv").config({ path: path.resolve('/etc/secrets', '.env') }) 
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const app = express(); 
process.stdin.setEncoding("utf8");
let json;
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const portNumber = 10000;
const databaseAndCollection = {db: "CMSC335_DB", collection:"finalProject"};
const { MongoClient, ServerApiVersion } = require('mongodb');
const apiKey = "58b3b72125cdaae9c019d1425ef126d1";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=";

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

async function checkWeather(city, temp) {
    const response = await fetch(apiUrl + temp + "&q=" + city + `&appid=${apiKey}`);
    var data = await response.json();
    return data
}

async function insertUser(client, databaseAndCollection, newApp) {
    await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newApp);
}

async function deleteAllUsers(client, databaseAndCollection) {
    const result = await client.db(databaseAndCollection.db)
                   .collection(databaseAndCollection.collection)
                   .deleteMany();
    
    return result.deletedCount;
}

async function findUsers(client, databaseAndCollection, unit) {
    let filter = {temp: unit};
    const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .find(filter, { projection: { name: 1, city: 1, temp: 1} });
    return result.toArray();
}

const uri = `mongodb+srv://${userName}:${password}@cimmanonroll.2xbkwdj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.get("/", (request, response) => {
    response.render("index");
});

app.get("/userLogin", (request, response) => {
    const variables = {
        portNum: `${portNumber}`
    };
    response.render("userLogin", variables);
});

app.get("/noUserLogin", (request, response) => {
    const variables = {
        portNum: `${portNumber}`
    };
    response.render("noUserLogin", variables);
});

app.get("/adminRemove", (request, response) => {
    const variables = {
        portNum: `${portNumber}`
    };
    response.render("adminRemove", variables);
});

app.get("/allUsers", (request, response) => {
    const variables = {
        portNum: `${portNumber}`
    };
    response.render("allUsers", variables);
});

app.use(bodyParser.urlencoded({extended:false}));

app.post("/adminRemove", async (request, response) => {
    const num = await deleteAllUsers(client, databaseAndCollection);
    response.render("processAdminRemove", {num});
});

app.post("/userLogin", async (request, response) => {
    const data = await checkWeather(request.body.city, request.body.temp);

    const newUser = {
        name: request.body.name, 
        email: request.body.email, 
        city: request.body.city, 
        temp: request.body.temp, 
        dataCity: data.name, 
        dataTemp: data.main.temp, 
        dataHum: data.main.humidity, 
        dataWind: data.wind.speed
    };  
    await insertUser(client, databaseAndCollection, newUser)
    response.render("showWeather", newUser);
});

app.post("/noUserLogin", async (request, response) => {
    const data = await checkWeather(request.body.city, request.body.temp);

    const newUser = {
        temp: request.body.temp, 
        dataCity: data.name, 
        dataTemp: data.main.temp, 
        dataHum: data.main.humidity, 
        dataWind: data.wind.speed
    };  
    await insertUser(client, databaseAndCollection, newUser)
    response.render("noUserWeather", newUser);
});

app.post("/allUsers", async (request, response) => {
    const gpaArr = await findUsers(client, databaseAndCollection, request.body.temp);
    let table = `<table border="1"><tr><th>Name</th><th>City</th><th>Temperature</th></tr>`;
    gpaArr.forEach((user) => {
        table += `<tr><td>${user.name}</td><td>${user.city}</td><td>${user.temp}</td></tr>`;
    });
    table += `</table>`;
    
    const variables = {
        table: `${table}`
    };
    response.render("sameUsers", variables);
});

app.listen(portNumber);

main().catch(console.error);
