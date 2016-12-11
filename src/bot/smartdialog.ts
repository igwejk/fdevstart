/**
 * The bot implementation
 *
 * Instantiate apssing a connector via
 * makeBot
 *
 */
/**
 * @file
 * @module jfseb.fdevstart.smartdialog
 * @copyright (c) 2016 Gerd Forstmann
 */
//declare module 'elizabot' { };

import * as builder from 'botbuilder';

import * as debug from 'debug';

import * as Exec from '../exec/exec';
import * as Match from '../match/match';

import * as Analyze from '../match/analyze';

var elizabot = require('elizabot');
//import * as elizabot from 'elizabot';

let debuglog = debug('smartdialog');
import * as PlainRecognizer from './plainrecognizer';
//var builder = require('botbuilder');

var dispatcher = require('../match/dispatcher.js').dispatcher;


function getConversationId(session: builder.Session): string {
  return session.message &&
    session.message.address &&
    session.message.address.conversation.id;
}

var elizabots = {};

function getElizaBot(id: string) {
  if (!elizabots[id]) {
    elizabots[id] = {
      access: new Date(),
      elizabot: new elizabot()
    };
  }
  elizabots[id].access = new Date();
  return elizabots[id].elizabot;
}

import * as IMatch from '../match/ifmatch';
import * as Tools from '../match/tools';

var newFlow = true;

import * as Model from '../model/model';
import * as ExecServer from '../exec/execserver';

const theModel = Model.loadModels();
if (newFlow) {

} else {

  //const tools = Tools.getTools();
  //const InputFilterRules = require('../match/inputFilterRules.js');
  //const mRules = InputFilterRules.getMRulesSample();
}



class SimpleRecognizer implements builder.IIntentRecognizer {
  constructor() {

  }

  recognize(context: builder.IRecognizeContext, callback: (err: Error, result: builder.IIntentRecognizerResult) => void): void {
    var u = {} as builder.IIntentRecognizerResult;

    console.log("recognizing " + context.message.text);
    if (context.message.text.indexOf("start") >= 0) {
      u.intent = "ShowEntity";
      u.score = 0.9;
      var e1 = {} as builder.IEntity;
      e1.startIndex = "start ".length;
      e1.endIndex = context.message.text.length;
      e1.score = 0.3;
      u.entities = [e1];
      callback(undefined, u);
      return;
    }

    if (context.message.text.indexOf("train") >= 0) {
      u.intent = "train";
      u.score = 0.9;
      var e1 = {} as builder.IEntity;
      e1.startIndex = "train ".length;
      e1.endIndex = context.message.text.length;
      e1.score = 0.3;
      u.entities = [e1];
      callback(undefined, u);
      return;
    }
    if (context.message.text.indexOf("learn") >= 0) {
      u.intent = "learn";
      u.score = 0.9;
      var e1 = {} as builder.IEntity;
      e1.type = "trainFact";
      e1.startIndex = "train ".length;
      e1.endIndex = context.message.text.length;
      e1.score = 0.3;
      u.entities = [e1];
      callback(undefined, u);
      return;
    }
    if (context.message.text.indexOf("help") >= 0) {
      u.intent = "help";
      u.score = 0.9;
      var e1 = {} as builder.IEntity;
      e1.startIndex = "train ".length;
      e1.endIndex = context.message.text.length;
      e1.score = 0.3;
      u.entities = [e1];
      callback(undefined, u);
      return;
    }
    if (context.message.text.indexOf("exit") >= 0) {
      u.intent = "exit";
      u.score = 0.9;
      var e1 = {} as builder.IEntity;
      e1.startIndex = "exit ".length;
      e1.endIndex = context.message.text.length;
      e1.score = 0.3;
      u.entities = [e1];
      callback(undefined, u);
      return;
    }
    if (context.message.text.indexOf("wrong") >= 0) {
      u.intent = "wrong";
      u.score = 0.9;
      var e1 = {} as builder.IEntity;
      e1.startIndex = "exit ".length;
      e1.endIndex = context.message.text.length;
      e1.score = 0.3;
      u.entities = [e1];
      callback(undefined, u);
      return;
    }
    console.log('recognizing nothing');
    u.intent = "None";
    u.score = 0.1;
    var e1 = {} as builder.IEntity;
    e1.startIndex = "exit ".length;
    e1.endIndex = context.message.text.length;
    e1.score = 0.1;
    u.entities = [];
    callback(undefined, u);
  }
}


class SimpleUpDownRecognizer implements builder.IIntentRecognizer {
  constructor() {

  }

  recognize(context: builder.IRecognizeContext, callback: (err: Error, result: builder.IIntentRecognizerResult) => void): void {
    var u = {} as builder.IIntentRecognizerResult;

    console.log("recognizing " + context.message.text);
    if (context.message.text.indexOf("down") >= 0) {
      u.intent = "intent.down";
      u.score = 0.9;
      var e1 = {} as builder.IEntity;
      e1.startIndex = "start ".length;
      e1.endIndex = context.message.text.length;
      e1.score = 0.3;
      u.entities = [e1];
      callback(undefined, u);
      return;
    }
    if (context.message.text.indexOf("up") >= 0) {
      u.intent = "intent.up";
      u.score = 0.9;
      var e1 = {} as builder.IEntity;
      e1.startIndex = "up".length;
      e1.endIndex = context.message.text.length;
      e1.score = 0.3;
      u.entities = [e1];
      callback(undefined, u);
      return;
    }
    console.log('recognizing nothing');
    u.intent = "None";
    u.score = 0.1;
    var e1 = {} as builder.IEntity;
    e1.startIndex = "exit ".length;
    e1.endIndex = context.message.text.length;
    e1.score = 0.1;
    u.entities = [];
    callback(undefined, u);
  }
}

const AnyObject = Object as any;
// globalTunnel.initialize({
//  host: 'proxy.exxxample.com',
//  port: 8080
// })

// Create bot and bind to console
// var connector = new htmlconnector.HTMLConnector()

// connector.setAnswerHook(function (sAnswer) {
//  console.log('Got answer : ' + sAnswer + '\n')
// })

var bot;
// setTimeout(function () {
//   connector.processMessage('start unit test ABC ')
// }, 5000)

import * as fs from 'fs';

var oJSON = JSON.parse('' + fs.readFileSync('./resources/model/intents.json'));
var oRules = PlainRecognizer.parseRules(oJSON);
// var Recognizer = new (recognizer.RegExpRecognizer)(oRules);


function logQuery(session: builder.Session, intent: string, result?: Array<IMatch.IToolMatch>) {

  fs.appendFile('./logs/showmequeries.txt', "\n" + JSON.stringify({
    text: session.message.text,
    timestamp: session.message.timestamp,
    intent: intent,
    res: result && result.length && Match.ToolMatch.dumpNice(result[0]) || "0",
    conversationId: session.message.address
    && session.message.address.conversation
    && session.message.address.conversation.id || "",
    userid: session.message.address
    && session.message.address.user
    && session.message.address.user.id || ""
  }), function (err, res) {
    if (err) {
      debuglog("logging failed " + err);
    }
  });
}

/**
 * Construct a bot
 * @param connector {Connector} the connector to use
 * HTMLConnector
 * or connector = new builder.ConsoleConnector().listen()
 */
function makeBot(connector) {
  bot = new builder.UniversalBot(connector);



  // Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
  // var model = sensitive.modelurl;
  // var model = 'https://api.projectoxford.ai/luis/v2.0/apps/c413b2ef-382c-45bd-8ff0-f76d60e2a821?subscription-key=c21398b5980a4ce09f474bbfee93b892&q='
  var recognizer = new PlainRecognizer.RegExpRecognizer(oRules);

  var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
  // dialog.onBegin(function(session,args) {
  // console.log("beginning ...")
  // session.dialogData.retryPrompt = args && args.retryPrompt || "I am sorry"
  // session.send("What do you want?")
  //
  // })

  var dialogUpDown = new builder.IntentDialog({ recognizers: [new SimpleUpDownRecognizer()] });

  bot.dialog('/updown', dialogUpDown);
  dialogUpDown.onBegin(function (session) {
    session.send("Hi there, updown is waiting for you");
  })

  dialogUpDown.matches('intent.up', [
    function (session, args, next) {
      session.dialogData.abc = args || {};
      builder.Prompts.text(session, 'you want to go up');
    },
    function (session, results, next) {
      session.dialogData.abc = results.reponse;
      next();
    },
    function (session, results) {
      session.endDialogWithResult({ response: session.dialogData.abc });
    }
  ]
  );

  dialogUpDown.matches('intent.down', [
    function (session, args, next) {
      session.dialogData.abc = args || {};
      builder.Prompts.text(session, 'you want to go down!');
    },
    function (session, results, next) {
      session.dialogData.abc = -1; // results.reponse;
      next();
    },
    function (session, results) {
      session.send("still going down?");
    }
  ]
  );
  dialogUpDown.onDefault(function (session) {
    logQuery(session, "onDefault");
    session.send("You are trapped in a dialog which only understands up and down, one of them will get you out");
    //builder.DialogAction.send('I\'m sorry I didn\'t understand. I can only show start and ring');
  });


  bot.dialog('/train', [
    function (session, args, next) {
      session.dialgoData.abc = args || {};
      builder.Prompts.text(session, 'Do you want to train me');
    },
    function (session, results, next) {
      session.dialogData.abc = results.reponse;
    },
    function (session, results) {
      session.endDialogWithResult({ response: session.DialogData.abc });
    }
  ]);


  bot.dialog('/', dialog);

  dialog.matches('ShowMe', [
    function (session, args, next) {
      var isCombinedIndex = {};
      var oNewEntity;
      // expecting entity A1
      debuglog("Show Entity");
      console.log('raw: ' + JSON.stringify(args.entities), undefined, 2);
      var a1 = builder.EntityRecognizer.findEntity(args.entities, 'A1');
      /*
            var client = builder.EntityRecognizer.findEntity(args.entities, 'client');
            var systemObjectId = builder.EntityRecognizer.findEntity(combinedEntities, 'systemObjectId') ||
              builder.EntityRecognizer.findEntity(combinedEntities, 'SystemObject') ||
              builder.EntityRecognizer.findEntity(combinedEntities, 'builtin.number');
            var systemObjectCategory = builder.EntityRecognizer.findEntity(args.entities, 'SystemObjectCategory');

            session.dialogData.system = {
              systemId: systemId,
              client: client
            };
      */
      /*
            var sSystemId = systemId && systemId.entity;
            var sClient = client && client.entity;
            var ssystemObjectId = systemObjectId && systemObjectId.entity;
            var sSystemObjectCategory = systemObjectCategory && systemObjectCategory.entity;
      */
    //if (newFlow) {
      const result = Analyze.analyzeAll(a1.entity,
          theModel.mRules, theModel.tools);

     // } else {

        //  const result = Analyze.analyzeAll(a1.entity,
        //     mRules, tools);
     // }
      logQuery(session, 'ShowMe', result);
      // test.expect(3)
      //  test.deepEqual(result.weight, 120, 'correct weight');
      if (!result || result.length === 0) {
        next();
      }
      // debuglog('result : ' + JSON.stringify(result, undefined, 2));
      debuglog('best result : ' + JSON.stringify(result[0] || {}, undefined, 2));
      debuglog('top : ' + Match.ToolMatch.dumpWeightsTop(result, { top: 3 }));


      if (Analyze.isComplete(result[0])) {
        session.dialogData.result = result[0];
        session.send('Showing entity ...');
        next();
      } else if (Analyze.getPrompt(result[0])) {
        var prompt = Analyze.getPrompt(result[0]);
        session.dialogData.result = result[0];
        session.dialogData.prompt = prompt;
        session.send("Not enough information supplied: " + Match.ToolMatch.dumpNice(
          session.dialogData.result
        ));
        builder.Prompts.text(session, prompt.text);
      } else {
        var best = result.length ? Match.ToolMatch.dumpNice(result[0]) : "<nothing>";
        //session.send('I did not understand this' + best);
        var reply =
          new builder.Message(session)
            .text('I did not understand this' + best)
            .addEntity({ url: "I don't know" });
        // .addAttachment({ fallbackText: "I don't know", contentType: 'image/jpeg', contentUrl: "www.wombat.org" });
        session.send(reply);

      }

      /*
            console.log('Show entities: ' + JSON.stringify(args.entities, undefined, 2));

            // do the big analyis ...
                  var u = dispatcher.execShowEntity({
              systemId: sSystemId,
              client: sClient,
              tool: sTool,
              systemObjectCategory: sSystemObjectCategory,
              systemObjectId: ssystemObjectId
            })
      */

      //  session.send('Showing entity ...');

      //  console.log("show entity, Show session : " + JSON.stringify(session))
      // console.log("Show entity : " + JSON.stringify(args.entities))
    },
    function (session, results, next) {
      var result = session.dialogData.result;
      if (!result || result.length === 0) {
        next();
      }

      if (results.response) {
        // some prompting
        Analyze.setPrompt(session.dialogData.result, session.dialogData.prompt, results.response);
      }
      if (Analyze.isComplete(session.dialogData.result)) {
        next();
      } else if (Analyze.getPrompt(session.dialogData.result)) {
        var prompt = Analyze.getPrompt(session.dialogData.result);
        session.dialogData.prompt = prompt;
        builder.Prompts.text(session, prompt.text);
      }
    },
    function (session, results, next) {
      var result = session.dialogData.result;
      if (results.response) {
        // some prompting
        Analyze.setPrompt(session.dialogData.result,
          session.dialogData.prompt, results.response);
      }
      if (Analyze.isComplete(session.dialogData.result)) {
        //
        //session.send("starting  > " +
     //   if (newFlow) {
          const exec = ExecServer.execTool(session.dialogData.result as IMatch.IToolMatch, theModel.records);
     //         )
//} else {
//  var exec = Exec.execTool(session.dialogData.result as IMatch.IToolMatch);
//}

var reply = new builder.Message(session)
  .text(exec.text)
  .addEntity(exec.action);
// .addAttachment({ fallbackText: "I don't know", contentType: 'image/jpeg', contentUrl: "www.wombat.org" });
session.send(reply);

      } else {
  if (session.dialogData.result) {
    session.send("Not enough information supplied: " + Match.ToolMatch.dumpNice(
      session.dialogData.result
    ));
  } else {
    session.send("I did not get what you want");
  }
}
    },
  ]);

dialog.matches('Wrong', [
  function (session, args, next) {
    session.beginDialog('/updown', session.userData.count);
  },
  function (session, results, next) {
    var alarm = session.dialogData.alarm;
    session.send("back from wrong : " + JSON.stringify(results));
    next();
  },
  function (session, results) {
    session.send('end of wrong');
  }
]);

dialog.matches('Exit', [
  function (session, args, next) {
    console.log('exit :');
    console.log('exit' + JSON.stringify(args.entities));
    session.send("you are in a logic loop ");
  }
]);
dialog.matches('Help', [
  function (session, args, next) {
    console.log('help :');
    console.log('help');
    session.send("I know about .... <categories>>");
  }
]);



// Add intent handlers
dialog.matches('train', [
  function (session, args, next) {
    console.log('train');
    // Resolve and store any entities passed from LUIS.
    var title = builder.EntityRecognizer.findEntity(args.entities, 'builtin.alarm.title');
    var time = builder.EntityRecognizer.resolveTime(args.entities);
    var alarm = session.dialogData.alarm = {
      title: title ? title.entity : null,
      timestamp: time ? time.getTime() : null
    };
    // Prompt for title
    if (!alarm.title) {
      builder.Prompts.text(session, 'What fact would you like to train?');
    } else {
      next();
    }
  },
  function (session, results, next) {
    var alarm = session.dialogData.alarm;
    if (results.response) {
      alarm.title = results.response;
    }

    // Prompt for time (title will be blank if the user said cancel)
    if (alarm.title && !alarm.timestamp) {
      builder.Prompts.time(session, 'What time would you like to set the alarm for?');
    } else {
      next();
    }
  },
  function (session, results) {
    var alarm = session.dialogData.alarm;
    if (results.response) {
      var time = builder.EntityRecognizer.resolveTime([results.response]);
      alarm.timestamp = time ? time.getTime() : null;
    }
    // Set the alarm (if title or timestamp is blank the user said cancel)
    if (alarm.title && alarm.timestamp) {
      // Save address of who to notify and write to scheduler.
      alarm.address = session.message.address;
      //alarms[alarm.title] = alarm;

      // Send confirmation to user
      var date = new Date(alarm.timestamp);
      var isAM = date.getHours() < 12;
      session.send('Creating alarm named "%s" for %d/%d/%d %d:%02d%s',
        alarm.title,
        date.getMonth() + 1, date.getDate(), date.getFullYear(),
        isAM ? date.getHours() : date.getHours() - 12, date.getMinutes(), isAM ? 'am' : 'pm');
    } else {
      session.send('Ok... no problem.');
    }
  }
]);

dialog.onDefault(function (session) {
  logQuery(session, "onDefault");
  var eliza = getElizaBot(getConversationId(session));
  var reply = eliza.transform(session.message.text);
  session.send(reply);
  //new Eilzabot
  //session.send("I do not understand this at all");
  //builder.DialogAction.send('I\'m sorry I didn\'t understand. I can only show start and ring');
});

  /*
  // Very simple alarm scheduler
  var alarms = {};
  setInterval(function () {
    var now = new Date().getTime();
    for (var key in alarms) {
      var alarm = alarms[key];
      if (now >= alarm.timestamp) {
        var msg = new builder.Message()
          .address(alarm.address)
          .text('Here\'s your \'%s\' alarm.', alarm.title);
        bot.send(msg);
        delete alarms[key];
      }
    }
  }, 15000);
  */
}

if (module) {
  module.exports = {
    makeBot: makeBot
  };
}
