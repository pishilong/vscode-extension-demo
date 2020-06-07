export type FeatureName = string;
export type TimeStamp = number;

export interface UserInfo {
  username: string;
}

export interface OnesInfo {
  name: string;
}

export interface FeatureInfo {
  projectName: string;
  featureName: FeatureName;
  onesInfo?: OnesInfo;
}

export interface WorkTimeDetail {
  [date: string]: {
    lastRecordTime: TimeStamp;
    workTime: number;
  }
}

export interface WorkTimeRecord {
  featureName: FeatureName;
  lastRecordTime: TimeStamp;
  workTime: number;
  detail: WorkTimeDetail;
}

export interface DateReverseIndex {
  [date: string]: Set<FeatureName>;
}