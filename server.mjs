import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import "dotenv/config";
import sendMessage from "./utiles/whatsappSendMessage.mjs";
import textQueryRequestResponse from "./utiles/DialogflowHelper.mjs";
import {
  WebhookClient,
  Card,
  Suggestion,
  Image,
  Payload,
} from "dialogflow-fulfillment";
mongoose.connect(
  "mongodb+srv://dbUser:dbUserPassword@cluster0.snbyo.mongodb.net/myPizzaOrderApp?retryWrites=true&w=majority",
  function () {
    console.log("db connected please move forward");
  }
);
const Carts = mongoose.model("carts", {
    orderNum: String,
    email: String,
    items: [{
        pizza: String,
        quantity: Number,
    }],
    
  });
const app = express();
const PORT = process.env.PORT || 3000;
// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const twilioClient = "";
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
  })
);

app.get("/", (req, res) => {
  res.send("Server is running");
});

//! Twilio messeging end point
app.post("/twiliowebhook", (req, res) => {
  // console.log("req: ", JSON.stringify(req.body));

  console.log("message: ", req.body.Body);

  // TODO: ask dialogflow what to respond

  let twiml = new twilio.twiml.MessagingResponse();
  twiml.message("The Robots are coming! Head for the hills!");

  res.header("Content-Type", "text/xml");
  res.send(twiml.toString());
});

//! Whatsapp webhook
app.post("/whatsappwebhook", (req, res) => {
  let message = req.body.Body;
  let senderID = req.body.From;

  console.log(`${message} --- ${senderID} --- ${process.env.TWILIO_NUMBER}`);

  sendMessage(
    twilioClient,
    "Hello From Pc",
    senderID,
    process.env.TWILIO_NUMBER
  );
});

//! Dialogflow response endpoint
app.post("/talktochatbot", async (req, res) => {
  const { responses } = await textQueryRequestResponse(
    process.env.DIALOGFLOW_PROJECT_ID,
    req.body.text,
    "en-US"
  );

  res.send({
    text: responses[0],
  });
});
app.post("/webhook", (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  function welcome(agent) {
    // agent.add(new Card({
    //     title: 'Vibrating molecules',
    //     imageUrl: "https://media.nationalgeographic.org/assets/photos/000/263/26383.jpg",
    //     text: 'Did you know that temperature is really just a measure of how fast molecules are vibrating around?! 😱',
    //     buttonText: 'Temperature Wikipedia Page',
    //     buttonUrl: "https://sysborg.com"
    // })
    // );

    // agent.add(` //ssml
    //     <speak>
    //         <prosody rate="slow" pitch="-2st">Can you hear me now?</prosody>
    //     </speak>
    // `);

    agent.add(
      "Welcome to Pizza order app you can ask me about to order pizza or can ask me about menu"
    );

    const facebookSuggestionChip = [
      {
        content_type: "text",
        title: "I am quick reply",
        // "image_url": "http://example.com/img/red.png",
        // "payload":"<DEVELOPER_DEFINED_PAYLOAD>"
      },
      {
        content_type: "text",
        title: "I am quick reply 2",
        // "image_url": "http://example.com/img/red.png",
        // "payload":"<DEVELOPER_DEFINED_PAYLOAD>"
      },
    ];
    const payload = new Payload("FACEBOOK", facebookSuggestionChip);
    agent.add(payload);
  }

  function showMenu(agent) {
    // Get parameters from Dialogflow to convert
    // const cityName = agent.parameters.cityName;

    // console.log(`User requested to city ${cityName}`);

    //TODO: Get weather from api

    // Compile and send response
    agent.add(
      "we have delicious menu we have fajita pizza chiken pizza and beef pizza which one would you like to order"
    );
    let image = new Image(
      "https://ashleemarie.com/wp-content/uploads/2016/02/chicken-fajita-pizza.jpg"
    );

    agent.add(image);
    image = new Image(
      "https://www.tasteandtellblog.com/wp-content/uploads/2021/01/BBQ-Chicken-Pizza-3.jpg"
    );
    agent.add(image);
    image = new Image(
      "https://media.istockphoto.com/photos/pizza-picture-id139892156?k=20&m=139892156&s=612x612&w=0&h=2LAE8_vSyJCEb1iEHXgnAf3ido1cPjj-1OPresIjaXA="
    );
    agent.add(image);
    // agent.add(new Suggestion('What is your name'));
    // agent.add(new Suggestion('Hi'));
    // agent.add(new Suggestion('Cancel'));
  }

  async function orderPizza(agent) {
    const slots = agent.parameters;
    console.log('slots====>',slots)
    let cart = await Carts.findOneAndUpdate(
        { email: 'test@gmail.com' },
        {
            email: 'test@gmail.com',
            orderNum: Math.floor(Math.random() * 100) + 1,
          $push: {
            items: [
              {
                pizza: slots?.flavor,
                quantity: Number(slots?.quantity),
              },
            ],
          },
        },
        { upsert: true }
      ).exec();
    agent.add("do you want to colddrink also");
   
  }
  function orderPizza_yes(agent) {
    
      console.log('agent is====>',agent)
    agent.add("your item has been added in the cart you can ask me about menu or you can also checkout");
   
  }
  function orderPizza_no(agent) {
    console.log('agent is====>',agent)
  agent.add("your item has been added in the cart you can ask me about menu or you can also checkout");
 
}
function checkout_yes(agent) {
    console.log('agent is====>',agent)
  agent.add("your order will arrive in 20 minutes");
 
}
function checkout_no(agent) {
    console.log('agent is====>',agent)
  agent.add("your cart has been added you can ask me about menu");
 
}
function checkout(agent) {
    console.log('agent is====>',agent)
  agent.add("are you sure really want to checkout?");
 
}
  function fallback(agent) {
    agent.add("sorry i can not understand");
   
  }

  let intentMap = new Map(); // Map functions to Dialogflow intent names
  intentMap.set("Default Welcome Intent", welcome);
  intentMap.set("showMenu", showMenu);
  intentMap.set("orderPizza", orderPizza); 
  intentMap.set("orderPizza_yes", orderPizza_yes);
  intentMap.set("orderPizza_no", orderPizza_no);
  intentMap.set("checkout", checkout);
  intentMap.set("checkout_yes", checkout_yes);
  intentMap.set("checkout_no", checkout_no);
  intentMap.set("Default Fallback Intent", fallback);
  

  agent.handleRequest(intentMap);
});
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
