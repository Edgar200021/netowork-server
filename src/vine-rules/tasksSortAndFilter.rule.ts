import vine from "@vinejs/vine";
import type { FieldContext } from "@vinejs/vine/types";
import type { TasksSort } from "../types/tasks.js";

export type TasksSortAndFilterOptions = {
	type: "sort" | "subCategoryIds";
};

const isTasksSort = (value: string): value is TasksSort => {
	const [field, direction] = value.split("-");

	return (
		(field === "createdAt" || field === "price") &&
		(direction === "asc" || direction === "desc")
	);
};

const tasksSortAndFilter = (
	value: unknown,
	options: TasksSortAndFilterOptions,
	field: FieldContext,
) => {
	if (typeof value !== "string") return;
	
	const array = value.trim().split(",");
	if (!value.trim() || array.length === 0) {
		field.report(`At least one ${options.type} is required`, "tasksSortAndFilter", field);
		return;
	}

	if (options.type === "sort") {
		for (const sort of array) {
			if (!isTasksSort(sort)) {
				field.report(
					`The "${sort}" is not a valid for sorting: Valid values are '${(["createdAt-asc", "createdAt-desc", "price-asc", "price-desc"] as TasksSort[]).join(", ")}'`,
					"tasksSortAndFilter",
					field,
				);
				return;
			}
		}
	}

	if (options.type === "subCategoryIds") {
		for (const subCategoryId of array) {
			if (isNaN(subCategoryId)) {
				field.report(
					`The "${subCategoryId}" must be a number`,
					"tasksSortAndFilter",
					field,
				);
				return;
			}
		}
	}
};

export const tasksSortAndFilterRule = vine.createRule(tasksSortAndFilter);
