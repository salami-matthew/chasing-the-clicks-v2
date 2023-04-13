const express = require("express");
const mongoose = require("mongoose");
const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));


// database default code block
const user = process.env.user;
const password = process.env.password;
mongoose.connect("mongodb+srv://" + user + ":" + password + "@cluster0.ukiqfyq.mongodb.net/countryDB");

const countrySchema = {
  name: String,
  clicks: Number
}

const Country = mongoose.model("Country", countrySchema);

// For local testing purposes

// const newCountry1 = new Country({
//   name: "Canada",
//   clicks: 24
// });
// const newCountry2 = new Country({
//   name: "Germany",
//   clicks: 54
// });

// const total = new Country({
//   name: "Total clicks",
//   clicks: 0
// });

// const defaultCountries = [total];

// Country.insertMany(defaultCountries).then(() => {
//   console.log("successfully added");
// }).catch((err) => {
//   console.log(err);
// });

// ------------------------------------------------------------


let clickCount = 0;
let totalClicks = 0;
let location = "";

fetch('https://ipapi.co//json/') //api for getting location using the user's IP address
  .then(function (response) {
    response.json().then(jsonData => {
      const country = jsonData.country_name;
      location = country; //update the default location
    });
  })
  .catch(function (error) {
    console.log(error)
  });


// get request made to my server
app.get("/", function (req, res) {

  // first get the current total number of clicks from db
  Country.findOne({ name: "Total clicks" }).then((foundCountry) => {
    totalClicks = foundCountry.clicks;
  });

  // then get all countries to be rendered and send to template file
  Country.find({ name: { $ne: "Total clicks" } }).then((foundCountries) => {
    res.render("index", { clickCount: totalClicks, foundCountries: foundCountries });
  }).catch(err => {
    console.log(err);
  })

});


// post request when the "Click Me" button is clicked
app.post("/", (req, res) => {

  totalClicks = totalClicks + 1;
  // update the total clicks
  const updateTotal = Country.updateOne({ name: "Total clicks" }, { clicks: totalClicks });

  // update the user's country clicks or create a new db document if new country detected
  Country.findOne({ name: location }).then((foundItem) => {
    if (foundItem) {
      clickCount = foundItem.clicks + 1;
      // update user's country clicks
      const updateSingle = Country.updateOne({ name: location }, { clicks: clickCount });
      Promise.all([updateSingle, updateTotal]).then((values) => {
        console.log("updated success");
        res.redirect("/"); //after updating the click count, redirect to root route for next click
      });
    } else {
      const newCountry = new Country({
        name: location,
        clicks: 1
      });
      const createCountry = newCountry.save();
      Promise.all([createCountry, updateTotal]).then(() => {
        console.log("updated success");
        res.redirect("/"); //after updating the click count, redirect to root route for next click
      });
    };
  });
});


// listen on port 3000
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log("server is running on port " + port);
});