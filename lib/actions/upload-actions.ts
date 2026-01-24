"use server"

import { ID } from "node-appwrite"
import { createPublicClient } from "../appwrite"
import { appwriteConfig } from "../appwrite/config"

export async function uploadFileToAppwrite(formData: FormData, userEmail: string) {
    try {
        const { storage, databases } = await createPublicClient()

        const teamName = formData.get("team-name") as string
        const workflowType = formData.get("workflow-type") as string
        const hourlyCost = formData.get("average-hourly-cost") as string
        const file = formData.get("file") as File
        const parsedDataString = formData.get("parsed-data") as string

        if (!file) {
            throw new Error("No file provided")
        }

        let parsedData = null;
        if (parsedDataString) {
            try {
                parsedData = JSON.parse(parsedDataString);
            } catch (e) {
                console.error("Failed to parse workflow data:", e);
            }
        }

        const uploadedFile = await storage.createFile(
            appwriteConfig.bucketId,
            ID.unique(),
            file
        )

        const document = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.collectionId,
            ID.unique(),
            {
                teamName,
                workflowType,
                averageHourlyCost: parseFloat(hourlyCost),
                fileId: uploadedFile.$id,
                bucketfileId: uploadedFile.$id,
                uploadedBy: userEmail
            }
        )

        return {
            success: true,
            data: document,
            parsedWorkflows: parsedData?.data || []
        }
    } catch (error: any) {
        console.error("❌ Upload Error:", error)
        
        return {
            success: false,
            error: error?.message || "Upload failed"
        }
    }
}