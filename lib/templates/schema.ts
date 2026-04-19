import { z } from "zod";

export const timelineItemSchema = z.object({
  period: z.string().min(1),
  text: z.string().min(1)
});

export const clinicalTemplateSchema = z.object({
  templateKey: z.string().min(1),
  category: z.string().min(1),
  plainName: z.string().min(1),
  normalSymptoms: z.array(z.string().min(1)).min(2),
  watchSymptoms: z.array(z.string().min(1)).min(2),
  alarmSymptoms: z.array(z.string().min(1)).min(2),
  doList: z.array(z.string().min(1)).min(2),
  avoidList: z.array(z.string().min(1)).min(2),
  timeline: z.array(timelineItemSchema).min(2),
  estimatedRecoveryDays: z.number().int().positive().optional(),
  milestones: z
    .array(
      z.object({
        startDay: z.number().int().min(0),
        endDay: z.number().int().min(0),
        title: z.string().min(1),
        description: z.string().min(1)
      })
    )
    .optional()
  ,
  recoveryProfile: z
    .discriminatedUnion("kind", [
      z.object({
        kind: z.literal("time_based"),
        estimatedRecoveryDays: z.number().int().positive(),
        milestones: z.array(
          z.object({
            startDay: z.number().int().min(0),
            endDay: z.number().int().min(0),
            title: z.string().min(1),
            description: z.string().min(1)
          })
        )
      }),
      z.object({
        kind: z.literal("chronic"),
        title: z.string().min(1),
        description: z.string().min(1),
        reviewEveryDays: z.number().int().min(1).max(365).optional()
      }),
      z.object({
        kind: z.literal("episodic"),
        title: z.string().min(1),
        description: z.string().min(1),
        typicalEpisodeDays: z.number().int().min(1).max(60).optional()
      })
    ])
    .optional()
});

export type ClinicalTemplateJson = z.infer<typeof clinicalTemplateSchema>;

