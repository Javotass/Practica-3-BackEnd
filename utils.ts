import type { TasksModel, Task } from "./types.ts";

export const deModeloaTask = (model: TasksModel): Task => ({
id: model._id!.toString(),
title: model.title,
completed: model.completed,
});