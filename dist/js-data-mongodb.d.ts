import {Adapter} from 'js-data-adapter'

interface IDict {
  [key: string]: any;
}
interface IBaseAdapter extends IDict {
  debug?: boolean,
  raw?: boolean
}
interface IBaseMongoDBAdapter extends IBaseAdapter {
  translateId?: boolean
  uri?: string
}
export class MongoDBAdapter extends Adapter {
  static extend(instanceProps?: IDict, classProps?: IDict): typeof MongoDBAdapter
  constructor(opts?: IBaseMongoDBAdapter)
}
export interface version {
  full: string
  minor: string
  major: string
  patch: string
  alpha: string | boolean
  beta: string | boolean
}