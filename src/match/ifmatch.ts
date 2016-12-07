

export const enum EnumResponseCode {
  NOMATCH = 0,
  EXEC,
  QUERY
}


export const CAT_CATEGORY = "category";
export const CAT_FILLER = "filler";
export const CAT_TOOL = "tool";


export interface IPromptDescription {
  description : string,
  type : string,
  pattern : RegExp,
  message : string,
  default : string,
  required : boolean
}

export const  enum EnumRuleType {
  WORD ,
  REGEXP
}

/**
 * @interface ITool
 *
 * var oTool = { 'name' : 'FLPD',
 *   'requires' : { 'systemId' : {}, 'client' :{}},
 *   'optional' : { 'catalog' : {}, 'group' :{}}
 * };
*/
export interface ITool {
  name : string,
  requires : { [key : string] : Object},
  optional? : { [key : string] : Object },
}

export interface IToolMatchResult {
  required : { [key : string] : IWord},
  missing :  { [key : string] : number},
  optional? : { [key : string] : IWord },
  spurious :  { [key : string] : number},
  toolmentioned : IWord[]
}

export interface IPrompt {
  text : string,
  category : string
}

export interface IToolMatch {
  toolmatchresult : IToolMatchResult,
  sentence : ISentence,
  tool: ITool,
  rank : number
}

export interface IWord {
  string : string,
  matchedString : string,
  category? : string,
  _ranking? : number,
  levenmatch? : number,
  reinforce? : number
}

export type ISentence = Array<IWord>;

export interface IRule {
  type : EnumRuleType,
  key : string,
  word? : string,
  regexp? : RegExp,
  argsMap? : { [key:number] : string}  // a map of regexp match group -> context key
  // e.g. /([a-z0-9]{3,3})CLNT([\d{3,3}])/
  //      { 1 : "systemId", 2 : "client" }
  follows : context
}

export interface IntentRule {
  type : EnumRuleType,
  regexp : RegExp,
  argsMap : { [key: string] : number}  // a map of regexp match group -> context key
  // e.g. /([a-z0-9]{3,3})CLNT([\d{3,3}])/
  //      { 1 : "systemId", 2 : "client" }
  follows? : context
}

/**
 * A rule matching a single string
 */
export interface mRule {
  type : EnumRuleType,
  word? : string,
  regexp? : RegExp,
  matchedString? : string,
  matchIndex? : number,
  category : string,
  _ranking? : number
}

export interface ICategorizedString  {
  string : string,
  matchedString : string,
  category : string,
  breakdown? : Array<any>
  score? : number,
  _ranking? : number,
  levenmatch? : number  // a distance ranking
}

export type context = { [key:string] :string };

/**
 * Defines the interface for an analysis
 * reponse
 */
export interface IResponse {
  rating : number,
  type : EnumResponseCode,
  query : string,
  context : { [key:string] :string},
  text : string,
  action : IAction,
  prompts : {
    [key :string ] : {
      text : string,
      /**
       * Follows the features of NPM prompts
       */
      description : IPromptDescription
      };
  }
}

export const enum EnumActionType {
  STARTURL,
  STARTCMDLINE
}

export interface IAction {
  data : any,
  type : EnumActionType,
  pattern : string,
  concrete : string
}
