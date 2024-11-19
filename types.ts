import { MongoClient, OptionalId } from "mongodb";

export type TasksModel = OptionalId<{
  title: string;
  completed: boolean;
}>;

export type Task = {
    id: string;
    title: string;
    completed:boolean;
};