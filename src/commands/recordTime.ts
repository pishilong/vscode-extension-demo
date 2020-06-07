import * as vscode from 'vscode';
import db from '../tool/db_helper';
import { UserInfo, FeatureInfo, FeatureName, WorkTimeRecord, DateReverseIndex } from '../tool/models';
import * as _ from 'lodash';

const saveInfo = async (userInfo: UserInfo, featureInfo: FeatureInfo) => {
  db.defaults({ 'featuresInfo': [], 'workTimeRecords': [], 'dateReverseIndex': {} }).write()

  // saveUserInfo
  const curUser: UserInfo = db.get('userInfo').value();
  if (!curUser || curUser.username !== userInfo.username) {
    // 如果没有用户信息或者用户信息发生了变更，则重置
    db.set('userInfo', userInfo).write();
  }

  // saveFeatureInfo
  // 如果featuresInfo不存在，则需要拉取oneInfo，并写入数据库
  // TODO 如果已经在数据库中了，是否需要重新拉取onesInfo来更新任务信息呢？
  if (!db.get('featuresInfo').find({ featureName: featureInfo.featureName}).value()) {
    const onesInfo = await getOnesInfo(featureInfo.featureName);

    featureInfo.onesInfo = onesInfo;
    db.get('featuresInfo').push(featureInfo).write();
  }
};

const recordWorkTime = (featureName: FeatureName) => {
  // 初始化新的工时记录
  const date = new Date();
  const dateString = date.toDateString(); //TODO, need format??2020-05-02
  const newRecord = {
    featureName: featureName,
    lastRecordTime: date.getTime(),
    workTime: 0,
    detail: {
      [dateString]: {
        lastRecordTime: date.getTime(),
        workTime: 0,
      }
    }
  };
  db.get('workTimeRecords').push(newRecord).write();

  // 反向索引只有记录新工时时需要更新
  const riKey = `dateReverseIndex.${dateString}`;
  let featureSet: Set<FeatureName> = db.get(riKey).value();

  if (!featureSet) {
    featureSet = new Set();
    featureSet.add(featureName);
  } else {
    featureSet.add(featureName);
  }
  db.set(riKey, featureSet).write();
};

const updateWorkTime = (worktimeRecord: WorkTimeRecord) => {
  const date = new Date();
  const dateString = date.toDateString(); //TODO, need format??2020-05-02

  // 有可能存在分支的工作记录，但没有当天的工作记录
  const curDateWorkRecord = _.get(worktimeRecord.detail, dateString);
  if (!curDateWorkRecord) {
    worktimeRecord.detail[dateString] = {
      lastRecordTime: date.getTime(),
      workTime: 0,
    };
    db.get('workTimeRecords').find({ featureName: worktimeRecord.featureName }).assign({
      lastRecordTime: date.getTime(),
      detail: worktimeRecord.detail,
    });
  } else {
    // 新工作的时长
    const newWorkTime = date.getTime() - curDateWorkRecord.lastRecordTime;
    // 更新当天的记录
    worktimeRecord.detail[dateString] = {
      lastRecordTime: date.getTime(),
      workTime: curDateWorkRecord.workTime + newWorkTime
    };

    db.get('workTimeRecords').find({ featureName: worktimeRecord.featureName }).assign({
      lastRecordTime: date.getTime(),
      workTime: worktimeRecord.workTime + newWorkTime, // 更新分支工作时长
      detail: worktimeRecord.detail, // TODO, 更新分支的工作详情, 可优化，应该可以只更新当天的，不用更新全量
    });
  }
};

export default function (userInfo: UserInfo, featureInfo: FeatureInfo) {
  console.log('---init command----');
  saveInfo(userInfo, featureInfo);

  return vscode.commands.registerCommand('work-kit-demo.recordTime', () => {
    const featureName = featureInfo.featureName;

    const worktimeRecord = db.get('worktimeRecords').find({ featureName: featureName }).value();

    if (!worktimeRecord) {
      // 没有记录工时
      recordWorkTime(featureName);
    } else {
      updateWorkTime(worktimeRecord);
    }
  });
};