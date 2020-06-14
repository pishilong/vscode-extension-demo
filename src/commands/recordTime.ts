import * as vscode from 'vscode';
import { session_provide } from '../tool/db_helper';
import { UserInfo, FeatureInfo, FeatureName, WorkTimeRecord, DateReverseIndex } from '../tool/models';
import * as _ from 'lodash';
import { LowdbSync } from 'lowdb';

export default class WorkTime {
  @session_provide()
  static record(...args: any[]) {
    const db = args.pop();
    console.log('record---');
    console.log(db);
  }
}