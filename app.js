const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const axios = require('axios');
const bcrypt = require('bcrypt');
const { uptime } = require("process");

import("node-fetch").then((nodeFetch) => {
    const fetch = nodeFetch.default;
});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('views'));
app.use(express.json());

app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));

mongoose.connect("mongodb://localhost:27017/NexDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const NexSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
    },

    points : {
        type: Number,
        default: 0,
    },

    votedTeam : {
        type: String,
    },

    password : {
        type: String,
        required: true,
    },

    cpassword:
    {
        type: String,
        required:true,
    }

});

const Nex = mongoose.model("Nex", NexSchema);

app.get("/", (req, res) => {
  async function fetchData() {
    const options = {
      method: 'GET',
      url: 'https://cricbuzz-cricket.p.rapidapi.com/schedule/v1/international',
      headers: {
          // 'X-RapidAPI-Key': 'cdae9d0a7amshb759c9e7f1a2fcdp1eca8fjsn6a7b5a6f27bb',
          // 'X-RapidAPI-Key': 'b15912910emsh5e91346d18e1dbep1ae0fejsne917d34536d5',
          'X-RapidAPI-Key': '036ffeb7f3msh1efcac76681fa18p169c42jsn362be3d2854b',
          'X-RapidAPI-Host': 'cricbuzz-cricket.p.rapidapi.com'
      }
    };
  
    try {
      const response = await axios.request(options);
  
      const matches = response.data.matchScheduleMap.filter(match => {
          if (match.scheduleAdWrapper && match.scheduleAdWrapper.matchScheduleList) {
            const series = match.scheduleAdWrapper.matchScheduleList.find(
              schedule => schedule.seriesId === 6732
            );
            return series !== undefined;
          }
          return false;
      });

      let k = 1;
      var board = [];

      Nex.find({})
        .sort({ points: -1 })
        .then(function (results) {
          board = [...results];

          let k = 1;

          for (let i = 0; i < matches.length; i++) {
            const match = matches[i].scheduleAdWrapper.matchScheduleList.filter(
              (series) => series.seriesId === 6732
            );

            const nowIST = new Date();
            const utcMilliseconds =
              nowIST.getTime() + nowIST.getTimezoneOffset() * 60000;

            const timestamp = Number(match[0].matchInfo[0].startDate);

            const date = new Date(timestamp);

            const ISTOptions = {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            };
            const ISTDate = new Intl.DateTimeFormat('en-US', ISTOptions).format(
              date
            );

            const diff = timestamp - utcMilliseconds;

            if (diff < 86400000) {
              if (k) {
                res.render("homepage", {
                  Match: `${match[0].matchInfo[0].team1.teamName} VS ${match[0].matchInfo[0].team2.teamName}`,
                  leads: board,
                  teamA: `${match[0].matchInfo[0].team1.teamName}`,
                  teamB: `${match[0].matchInfo[0].team2.teamName}`,
                });
                k--;
              } else {
                break;
              }
            }
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    } catch (error) {
      console.error(error);
    }
  }
  fetchData();
});


app.get("/form", (req, res) => {
  res.render("form");
});

// Sign-up and Sign-in route using /homepage
app.post("/homepage", async (req, res) => {
  const action = req.body.action;
  // Adding an "action" parameter to distinguish between sign-up and sign-in.

  if (action === "signup") {
    try {
      const username = req.body.username;
      const password = req.body.password;
      const cpassword = req.body.cpassword;

      const user = await Nex.findOne({username: username});

      if(user) {
        res.send(
          '<script>alert("Username already exists."); window.location = "/form";</script>'
        );
      }
      else{
        if (password === cpassword) {
          const player = new Nex({
            username: req.body.username,
            password: req.body.password,
            cpassword: req.body.cpassword,
          });
  
          player.save();
          res.redirect("/form");
        } else {
          '<script>alert("Passwords do not match"); window.location = "/form";</script>'
        }
      }
    } catch (error) {
      res.send(error);
    }
  } else if (action === "signin") {
    try {
      const username = req.body.username;
      const password = req.body.loginPassword;

      const getUsername = await Nex.findOne({ username: username });

      if (getUsername && getUsername.password == password) {
        res.redirect("/");
      } else {
        res.send(
          '<script>alert("Username or password is incorrect"); window.location = "/form";</script>'
        );

        // alert("username or password incorrect");
        // res.render("form", { passwordIsIncorrect: true });
      }
    } catch (error) {
      res.send(error);
    }
  }
});

app.post("/votes", async (req, res) => {
  const vote = req.body.team;
  const user = req.body.username;
  const pass = req.body.password;

  try {
    const existingUser = await Nex.findOne({ username: user });

    if (existingUser && existingUser.password === pass) {
      await Nex.updateMany({ username: user }, { $set: { votedTeam: vote } });
      res.send('<script>alert("Submitted Successfully"); window.location = "/";</script>');
    } else {
      res.send('<script>alert("Username or password is incorrect"); window.location = "/";</script>');
    }
  } catch (error) {
    console.error("Error in /votes:", error);
    res.status(500).send("Internal Server Error");
  }
});


function enterWinner(winner, loser) {
    let A = 0;
    let B = 0;
  
    let winnerScore = 0;
    const tot = 100;
  
    Nex.find({})
      .then(function (items) {
        items.forEach(function (item) {
          if (item.votedTeam === winner) A++;
          else if (item.votedTeam === loser) B++;
        });
  
        if (B === 0) {
          winnerScore = (tot / A).toFixed(2);
        } else {
          winnerScore = ((tot * B) / (A + B)).toFixed(2);
        }
  
        items.forEach(function (item) {
          if (item.votedTeam === winner) {
            item.points += winnerScore;
            item.save()
              .then(function () {})
              .catch(function (err) {
                console.log(err);
              });
          }
        });
      })
      .catch(function (err) {
        console.log(err);
      });
}
  
enterWinner("Afghanistan","New Zealand");


app.listen(3000, () => {
    console.log("Server started running on port 3000");
});

// ICC Cricket World Cup 2023 