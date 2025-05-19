import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";
import { GET_ALL_TASKS_MAX_LIMIT } from "../../../const/validator.js";
import type { TasksSort } from "../../../types/tasks.js";
import { tasksSortAndFilterRule } from "../../../vine-rules/tasksSortAndFilter.rule.js";


export const getAllTasksSchema = vine.object({
	limit: vine.number().positive().max(GET_ALL_TASKS_MAX_LIMIT).optional(),
	page: vine.number().positive().optional(),
	subCategoryIds: vine
		.string()
		.use(
			tasksSortAndFilterRule({
				type: "subCategoryIds",
			}),
		)
		.optional(),
	sort: vine
		.string()
		.use(
			tasksSortAndFilterRule({
				type: "sort",
			}),
		)
		.optional(),
});

export type GetAllTasksRequestDto = InferInput<typeof getAllTasksSchema>;
