import { Client, Databases, Storage } from "node-appwrite"
import { appwriteConfig } from "./config"
import { cookies } from "next/headers"


export const createPublicClient = async () => {
    const client = new Client()
        .setEndpoint(appwriteConfig.endpointUrl)
        .setProject(appwriteConfig.projectId)
        .setKey(appwriteConfig.secretKey)

    const databases = new Databases(client);
    const storage = new Storage(client);

    return {
        databases,
        storage
    };
};