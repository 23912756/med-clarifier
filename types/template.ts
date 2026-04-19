export type TimelineItem = {
  period: string;
  text: string;
};

export type RecoveryMilestone = {
  startDay: number;
  endDay: number;
  title: string;
  description: string;
};

export type RecoveryProfile =
  | {
      kind: "time_based";
      estimatedRecoveryDays: number;
      milestones: RecoveryMilestone[];
    }
  | {
      kind: "chronic";
      title: string;
      description: string;
      reviewEveryDays?: number;
    }
  | {
      kind: "episodic";
      title: string;
      description: string;
      typicalEpisodeDays?: number;
    };

export type ClinicalTemplate = {
  templateKey: string;
  category: string;
  plainName: string;
  normalSymptoms: string[];
  watchSymptoms: string[];
  alarmSymptoms: string[];
  doList: string[];
  avoidList: string[];
  timeline: TimelineItem[];
  // Legacy (kept for backward compatibility)
  estimatedRecoveryDays?: number;
  milestones?: RecoveryMilestone[];

  // New (preferred)
  recoveryProfile?: RecoveryProfile;
};