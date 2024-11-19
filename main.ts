import { MongoClient, ObjectId } from "mongodb";
import { TasksModel, Task } from "./types.ts";
import { deModeloaTask } from "./utils.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");
if (!MONGO_URL) {
  console.log("MONGO_URL not set");
  Deno.exit(1);
}
const client = new MongoClient(MONGO_URL);

// Database Name
const dbName = "nebrija-practica3";
await client.connect();
console.log("Connected successfully to server");
const db = client.db(dbName);

const tasksCollection = db.collection<TasksModel>("tasks");

const handler = async (req: Request): Promise<Response> => {
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  if (method === "GET") {
    //mostrar todos las tareas
    if (path === "/tasks") {
      const tasks = db.collection("tasks");
      const tasksList = await tasks.find().toArray();
      return new Response(JSON.stringify(tasksList));

    }
    //buscar con id
    else if (path.startsWith("/tasks/")) {
    const id = path.split("/")[2]; // Extrae el ID de la ruta
    const taskDB = await tasksCollection.findOne({ _id: new ObjectId(id) }); // Busca la tarea en la base de datos
    if (!taskDB){
        return new Response(JSON.stringify({ error: "Tarea no encontrada" }), { status: 404 });
    }else
        return new Response(JSON.stringify(deModeloaTask(taskDB)), { status: 200 });
    }
  } else if (method === "POST") {
    //crear una nueva actividad
    if(path === "/tasks"){
        const task = await req.json();
        //comprobamos el titulo 
        if(!task.title ){
          return new Response("Bad request", {status:405});
        }
        const userDB = await tasksCollection.findOne({title: task.title});
        if(userDB) return new Response("Bad request", {status:406});
        //insertamos los valores de la nueva tarea
        const { insertedId } = await tasksCollection.insertOne({
          title: task.title,
          completed: false,
        });

        //se devuelve la actividad añadida con todos sus valores
        return new Response (JSON.stringify({
          id: insertedId,
          title: task.title,
          completed: false,
        }),{status: 407});
    }
  } else if (method === "PUT") {
    const path = url.pathname;
    if (path.startsWith("/tasks/")) {
      const id = path.split("/")[2]; // Extraer el ID 
      if (!id) {
        return new Response("ID de tarea no proporcionado", { status: 400 });
      }

      //Coger el cuerpo de la solicitud
      const body = await req.json();
      const { completed } = body;

      if (typeof completed !== "boolean") { //comprobación si es booleano
        return new Response("El campo 'completed' debe ser booleano", {
          status: 400,
        });
      }

      // Actualizar la tarea en la db
      const result = await tasksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { completed } }
      );

      if (result.matchedCount === 0) { //comprobación de actualización
        return new Response("Tarea no encontrada", { status: 404 });
      }

      // Recuperar la tarea actualizada
      const updatedTask = await tasksCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!updatedTask) {
        return new Response("Error al recuperar la tarea actualizada", {status: 500});
      }

      //Tarea cambiada resultante
      return new Response(
        JSON.stringify({
          id: updatedTask._id.toString(),
          title: updatedTask.title,
          completed: updatedTask.completed,
        }),{status: 200}
      );
    } 
  }else if (method === "DELETE" && path.startsWith("/tasks/")) {
        // Extraemos el ID
        const id = path.split("/")[2];
        const { deletedCount } = 
            await tasksCollection.deleteOne({ _id: new ObjectId(id) }); // Eliminamos la tarea

        if (deletedCount === 0){
            return new Response(JSON.stringify({ error: "Tarea no encontrada" }), { status: 404 });
        }
            return new Response(JSON.stringify({ message: "Tarea eliminada correctamente" }), { status: 200 });
      }

  return new Response("Endpoint not found", { status: 404 });
};
Deno.serve({ port: 3000 }, handler);
