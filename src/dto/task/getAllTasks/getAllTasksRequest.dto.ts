import vine from "@vinejs/vine";
import type { InferInput } from "@vinejs/vine/types";
import { GET_ALL_TASKS_MAX_LIMIT } from "../../../const/validator.js";
import { tasksSortAndFilterRule } from "../../../vine-rules/tasksSortAndFilter.rule.js";

export const getAllTasksRequestQuerySchema = vine.object({
	limit: vine.number().min(1).max(GET_ALL_TASKS_MAX_LIMIT).optional(),
	page: vine.number().min(1).optional(),
	search: vine.string().minLength(1).optional(),
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

export type GetAllTasksRequestQueryDto = InferInput<
	typeof getAllTasksRequestQuerySchema
>;
