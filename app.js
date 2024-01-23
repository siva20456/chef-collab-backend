const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const bcrypt = require('bcrypt')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const sgMail = require('@sendgrid/mail')
const app = express();
const port = process.env.PORT;

const authorizeTheUser = require('./Middlewares/Authorizing')

app.use(cors())
app.use(express.json())


// DataBase Connection starts


console.log(process.env.URL)
// Create a new MongoClient
const client = new MongoClient(process.env.URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// // Connect to the server
client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB', err);
  });
const db = client.db('ChefCollab');
// console.log(db.collection('Chefs').find())

// app.use((req, res, next) => {
//   client.connect().then(() => {
//     req.db = client.db('ChefCollab');
//     next();
//   }).catch(err => {
//     console.error('Error connecting to MongoDB', err);
//     next(err);
//   });
// });
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin","http://localhost:3004");
  res.header('Access-Control-Allow-Methods', 'GET, POST, UPDATE, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept , Authorization");
  next()
});

// DataBase Connection Ends 


// Registration and Sign Functionalities

app.post('/register', async (req, res, next) => {
  try {
    console.log(req.body)
    const { fname, lname, name, password, age, mobile, email, location, specialty, gender } = req.body
    console.log(name, password, age, mobile)
    const db_user = await db.collection('Chefs').findOne({ "username": name })
    const mail_check = await db.collection('Chefs').findOne({ mail: email })
    // console.log(db_user)

    if (db_user === null && mail_check === null) {
      const hashed_password = await bcrypt.hash(password, 10)
      const feed = await db.collection('Chefs').insertOne({ f_name: fname, l_name: lname, username: name, password: hashed_password, age, mobile, mail: email, location, specialty, exp_salary: 0, experience: 0, prev_salary: 0, rating: 0, relocate: false, gender })
      const ffed1 = await db.collection('ChefPortfolios').insertOne({ username: name, mail: email, desc: '', isCompleted: false, skills: [], mailVerification: false })
      console.log(feed)
      sgMail.setApiKey(process.env.SEND_GRID_KEY);
      var mailOptions = {
        from: process.env.FROM_MAIL, // sender address
        to: email, // list of receivers
        subject: 'Greetings from FindUrChef', // Subject line
        text: `Hi Chef ,Greetings from FindUrChef Login to your Account and Complete the portfolio for better experience`, // plaintext body
        html: `<b>Hi Chef, Greetings from FindUrChef Login to your Account and Complete the portfolio for better experience</b>` // html body
      };

      sgMail.send(mailOptions).then(r => {
        console.log(r)
        res.send({ otp: String(code) })
      }).catch(e => console.log(e))

      // res.status(200).send(feed)
      const payload = {
        mail: email
      }
      const jwt_token = jwt.sign(payload, `Secret Token`)
      res.send({ jwt_token })
      console.log(name)
    } else if (db_user !== null) {
      res.status(400).send({ error: 'Username is already in use' })
    } else if (mail_check !== null) {
      res.status(400).send({ error: 'Mail is already in use' })
    }
    else {
      res.status(400).send({ error: 'Try again with different values' })
    }
    // console.log(params.details)



  } catch (e) {
    console.error(e)
  }
})

app.post('/RestRegister', async (req, res, next) => {
  try {
    console.log(req.body)
    const { restaurantName, email, password, mobile, location, style } = req.body
    console.log(restaurantName, email, password)
    const db_user = await db.collection('Restaurants').findOne({ "name": restaurantName })
    const mail_check = await db.collection('Restaurants').findOne({ mail: email })
    // console.log(db_user)

    if (db_user === null && mail_check === null) {
      const hashed_password = await bcrypt.hash(password, 10)
      const feed = await db.collection('Restaurants').insertOne({ name: restaurantName, password: hashed_password, mobile, mail: email, location: location, style })
      const feed2 = await db.collection('RestPortfolios').insertOne({ name: restaurantName, mail: email, location, rating: 0, salaryMargin: 0, req: {}, mailVerification: false, desc: '', isCompleted: false, style, avgCust: 0 })
      console.log(feed)
      sgMail.setApiKey(process.env.SEND_GRID_KEY);
      var mailOptions = {
        from: process.env.FROM_MAIL, // sender address
        to: email, // list of receivers
        subject: 'Greetings from FindUrChef', // Subject line
        text: `Hi Restauarant , Greetings from FindUrChef Login to your Account and Complete the portfolio for better experience`, // plaintext body
        html: `<b>Hi Restauarant , Greetings from FindUrChef Login to your Account and Complete the portfolio for better experience</b>` // html body
      };

      sgMail.send(mailOptions).then(r => {
        console.log(r)
        res.send({ otp: String(code) })
      }).catch(e => console.log(e))
      // res.status(200).send(feed)
      const payload = {
        mail: email
      }
      const jwt_token = jwt.sign(payload, `Secret Token`)
      res.send({ jwt_token })
      console.log(restaurantName)
    } else if (db_user !== null) {
      res.status(400).send({ error: 'Restaurant Name is already in use' })
    } else if (mail_check !== null) {
      res.status(400).send({ error: 'Mail is already in use' })
    }
    else {
      res.status(400).send({ error: 'Try again with different values' })
    }
    // console.log(params.details)



  } catch (e) {
    console.error(e)
  }
})

app.post('/login', async (req, res, next) => {
  try {
    const { mail, password } = req.body
    const user_data = await db.collection('Chefs').findOne({ "mail": mail })
    // res.send(user_data)
    console.log(user_data)
    if (user_data === null) {
      res.status(400).send({
        data: "User Not Found"
      })
    } else {
      const is_password_true = await bcrypt.compare(password, user_data.password)
      if (is_password_true === true) {
        const payload = {
          mail: mail
        }
        const jwt_token = jwt.sign(payload, `Secret Token`)
        res.send({ jwt_token })
        console.log(mail)
      } else {
        res.status(400).send({
          data: "Incorrect Password"
        })
      }
    }

  } catch (e) {
    console.error(e)
  }
})

app.post('/RestLogin', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user_data = await db.collection('Restaurants').findOne({ "mail": email })
    // res.send(user_data)
    console.log(user_data)
    if (user_data === null) {
      res.status(400).send({
        data: "Restaurant Not Found"
      })
    } else {
      const is_password_true = await bcrypt.compare(password, user_data.password)
      if (is_password_true === true) {
        const payload = {
          mail: email
        }
        const jwt_token = jwt.sign(payload, `Secret Token`)
        res.send({ jwt_token })
        console.log(email)
      } else {
        res.status(400).send({
          data: "Incorrect Password"
        })
      }
    }

  } catch (e) {
    console.error(e)
  }
})

// Registration and Sign Functionalities End Here 


// Retrieving chef & Restaurant data 

app.get('/chefData', async (req, res, next) => {
  try {
    const app_data = await db.collection('Chefs').find({}).toArray()
    res.status(200).send(app_data)
  } catch (e) {
    console.error(e)
  }
})

app.get('/restData', async (req, res, next) => {
  try {
    const app_data = await db.collection('Restaurants').find({}).toArray()
    res.status(200).send(app_data)
  } catch (e) {
    console.error(e)
  }
})

// Edns Here

// Retrieving Personal Data 

app.get('/getInfo', authorizeTheUser, async (req, res, next) => {
  try {
    const { mail } = req
    console.log(mail)
    const user_data = await db.collection('Chefs').findOne({ mail })
    const user_portfolio = await db.collection('ChefPortfolios').findOne({ mail })
    // console.log(user_data,user_portfolio)
    // console.log(user_data)
    res.status(200).send({ user_data, user_portfolio })
  } catch (e) {
    console.log(e)
    res.status(400)
  }
})


app.get('/getRestInfo', authorizeTheUser, async (req, res, next) => {
  try {
    const { mail } = req

    const user_data = await db.collection('Restaurants').findOne({ mail })
    const user_portfolio = await db.collection('RestPortfolios').findOne({ mail })
    console.log(user_data)
    // console.log()
    res.status(200).send({ user_data, user_portfolio })
  } catch (e) {
    console.log(e)
    res.status(400)
  }
})


// Updation of Data 

app.post('/updateRestPortfolio', authorizeTheUser, async (req, res, next) => {
  try {
    const { data, portfolio } = req.body
    const { mail } = req
    delete data._id
    delete portfolio._id
    const feed = await db.collection('Restaurants').updateOne({ mail: mail }, { $set: { ...data } })
    const feed1 = await db.collection('RestPortfolios').updateOne({ mail: mail }, { $set: { ...portfolio } })
    console.log(feed, feed1)
    if (feed.acknowledged && feed1.acknowledged) {
      res.status(200).send({ data: 'Updated Successful' })
    } else {
      res.status(401)
    }
  } catch (e) {
    console.log(e)
    res.status(400)
  }
})

app.post('/updateChefPortfolio', authorizeTheUser, async (req, res, next) => {
  try {
    const { data, portfolio } = req.body
    const { mail } = req
    delete data._id
    delete portfolio._id
    const feed = await db.collection('Chefs').updateOne({ mail: mail }, { $set: { ...data } })
    const feed1 = await db.collection('ChefPortfolios').updateOne({ mail: mail }, { $set: { ...portfolio } })
    console.log(feed, feed1)
    if (feed.acknowledged && feed1.acknowledged) {
      res.status(200).send({ data: 'Updated Successfull' })
    } else {
      res.status(401)
    }
  } catch (e) {
    console.log(e)
    res.status(400)
  }
})


// Getting Detail Data 

app.post('/chefDetail', async (req, res, next) => {
  try {
    const { username } = req.body
    const user_data = await db.collection('Chefs').findOne({ username })
    const portfolio = await db.collection('ChefPortfolios').findOne({ username })

    const specialty = user_data.specialty
    const similarChefs = await db.collection('Chefs').find({ specialty }).toArray()

    res.status(200).send({ user_data, portfolio, similarChefs })
  } catch (e) {
    console.log(e)
    res.status(400)
  }
})

app.post('/restDetail', async (req, res, next) => {
  try {
    const { name } = req.body
    const user_data = await db.collection('Restaurants').findOne({ name })
    const portfolio = await db.collection('RestPortfolios').findOne({ name })

    res.status(200).send({ user_data, portfolio })
  } catch (e) {
    console.log(e)
    res.status(400)
  }
})


// Mail Verification 

app.post('/verifyMail', async (req, res, next) => {
  const { mail } = req.body
  console.log(req.body)
  sgMail.setApiKey(process.env.SEND_GRID_KEY);
  const code = Math.ceil(Math.random() * 100000)
  // console.log(code)

  // setup e-mail data with unicode symbols
  var mailOptions = {
    from: process.env.FROM_MAIL, // sender address
    to: mail, // list of receivers
    subject: 'OTP for Verification', // Subject line
    text: `Greetings from FindUrChef, Your one time verification code is ${code}`, // plaintext body
    html: `<b>Greetings from FindUrChef, Your one time verification code is ${code}</b>` // html body
  };

  sgMail.send(mailOptions).then(r => {
    console.log(r)
    res.send({ otp: String(code) })
  }).catch(e => console.log(e))
})


// Sending Details 

app.post('/sendChefDetails', async (req, res, next) => {
  try {
    const { username, mail } = req.body
    const user_data = await db.collection('Chefs').findOne({ username })
    const portfolio = await db.collection('ChefPortfolios').findOne({ username })

    sgMail.setApiKey(process.env.SEND_GRID_KEY);

    // setup e-mail data with unicode symbols
    var mailOptions = {
      from: process.env.FROM_MAIL, // sender address
      to: mail, // list of receivers
      subject: 'Chef Details From FindUrChef', // Subject line
      text: `Greetings from FindUrChef, Mail and Mobile Number of Requested Chef - ${user_data.f_name} ${user_data.l_name} are ${user_data.mail} ${user_data.mobile}`, // plaintext body
      html: `<b>Greetings from FindUrChef, Mail and Mobile Number of Requested Chef - ${user_data.f_name} ${user_data.l_name} are ${user_data.mail}  ${user_data.mobile}</b>` // html body
    };

    sgMail.send(mailOptions).then(r => {
      console.log(r)
      res.send({ data: 'Sent' })
    }).catch(e => console.log(e))
  } catch (e) {
    console.log(e)
    res.status(400)
  }
})

app.post('/addRequest', async (req, res, next) => {
  try {
    const { name, mail } = req.body
    const rest_data = await db.collection('Restaurants').findOne({ name })
    const portfolio = await db.collection('RestPortfolios').findOne({ name })
    const user_data = await db.collection('Chefs').findOne({ mail })
    const user_portfolio = await db.collection('ChefsPortfolio').findOne({ mail })
    const checking = await db.collection('Requests').find({ rest_name: rest_data.name }).toArray()
    const senChecking = checking.filter(e => e.chef_name === user_data.username)
    console.log(senChecking)
    if (senChecking.length === 0) {
      const new_one = { rest_name: rest_data.name, rest_mail: rest_data.mail, rest_location: rest_data.location, rest_style: rest_data.style, chef_name: user_data.username, chef_mail: user_data.mail, chef_location: user_data.location, chef_style: user_data.specialty }
      const fedd = await db.collection('Requests').insertOne({ ...new_one })
      if (fedd.acknowledged) {
        res.status(200).send({ data: 'Request Sent..!' })
      } else {
        res.status(400).send({ data: 'Please Try Again' })
      }
    } else {
      res.status(200).send({ data: 'Request already raised..!' })
    }

  } catch (e) {
    console.log(e)
    res.status(400).send({ data: 'Something Went Wrong... Try Again' })
  }


})

app.get('/getRequests', async (req, res, next) => {
  try {
    const requests = await db.collection('Requests').find().toArray()
    res.status(200).send({ data: requests })
  } catch (e) {
    console.log(e)
    res.status(400).send({ data: 'Something Went Wrong..!' })
  }
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


module.exports = client

module.exports = app