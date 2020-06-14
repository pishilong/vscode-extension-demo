import * as fs from 'fs';
import * as lowdb from "lowdb";
import * as _ from 'lodash';
import { resolve } from 'path';
const FileSync = require('lowdb/adapters/FileSync');

const DB_FILE_PATH = 'work-kit.db.json';
const LOCK_FILE = '__db_lock__';


let retryTimer: NodeJS.Timer | null = null;

const MAX_RETRY = 5;
const RETRY_INTERVAL = 5000;
function connectDB(retriesLeft = MAX_RETRY) {
  return new Promise((resovled, rejected) => {
    getDBInstance().then(resovled).catch((reason) => {
      setTimeout(() => {
        console.log(`getDBInstance failed, reason: ${reason}, retriesLeft: ${retriesLeft}`);
        if (retriesLeft === 0) {
          return rejected('maxium retries exceeded');
        }
        connectDB(retriesLeft - 1).then(resovled);
      }, RETRY_INTERVAL);
    });
  });
}

function getDBInstance() {
  return new Promise((resolved, rejected) => {
    if (fs.existsSync(LOCK_FILE)) {
      rejected('db locked!');
    } else {
      lockDB();
      const adapter = new FileSync(DB_FILE_PATH);
      resolved(lowdb(adapter));
    }
  });
}

function lockDB() {
  fs.writeFileSync(LOCK_FILE, 'db.lock');
}

function releaseDB() {
  fs.unlinkSync(LOCK_FILE);
}

function session_provide() {
  return function (
    target: object,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
  ) {
   let originalMethod = propertyDescriptor.value;

    propertyDescriptor.value = function (...args: any[]) {
      connectDB().then((db) => {
        console.log('--session provide, got db!---');
        args.push(db);
        const result = originalMethod.apply(this, args);
        releaseDB();
        return result;
      });
    };
  };
}

export {
  session_provide,
};
