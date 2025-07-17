import Together from "together-ai";

const together = new Together();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const projectDescription = formData.get('projectDescription') as string;
    const files = formData.getAll('files') as File[];

    if (!projectDescription || files.length === 0) {
      return new Response('Project description and files are required', { status: 400 });
    }

    // Process files and extract content
    const fileContents: { filename: string; content: string }[] = [];
    let packageJsonContent: any = {};

    for (const file of files) {
      try {
        const fileContent = await file.text();
        fileContents.push({ filename: file.name, content: fileContent });
        
        if (file.name === "package.json") {
          try {
            packageJsonContent = JSON.parse(fileContent);
          } catch (e) {
            console.error("Failed to parse package.json", e);
          }
        }
      } catch (error) {
        console.error(`Failed to read file ${file.name}:`, error);
      }
    }

    // Extract dependencies from package.json
    const dependencies = packageJsonContent.dependencies
      ? Object.keys(packageJsonContent.dependencies).join(", ")
      : "No dependencies found or package.json not provided.";

    // Create file structure summary for prompt
    const fileStructurePrompt = fileContents
      .map((file) => `File: ${file.filename}\nContent:\n${file.content.substring(0, 2000)}${file.content.length > 2000 ? '...' : ''}\n---`)
      .join("\n");

    // Construct prompt for Together AI
    const promptContent = `
You are an AI assistant specialized in generating project context files for other AIs.
Given a project description and the contents of its codebase files, generate a comprehensive JSON object.

The JSON object should have the following structure:
{
  "projectSummary": "A brief summary of the project.",
  "techStack": "Key technologies used (e.g., Next.js, React, Tailwind CSS, Node.js, Express, MongoDB).",
  "dependencies": "A comma-separated list of all dependencies from package.json.",
  "fileStructure": "A summary of the project's file structure and the role of important files.",
  "coreLogic": "A description of the main data flow, key functions, and how different parts of the application interact."
}

Here is the user's project description:
"${projectDescription}"

Here are the dependencies found: ${dependencies}

Here are the codebase files:
${fileStructurePrompt}

Please ensure your response is ONLY the JSON object, and nothing else. Make sure it's valid JSON.
    `;

    // Call Together AI API
    const response = await together.chat.completions.create({
      model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates project context files in JSON format. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: promptContent
        }
      ],
      // @ts-expect-error - Together AI types may not include response_format
      response_format: { type: "json_object" }
    });

    const rawResponse = response.choices[0].message?.content;
    
    if (!rawResponse) {
      throw new Error("No response from AI");
    }

    // Parse and validate JSON response
    let contextJson;
    try {
      contextJson = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Fallback: create a basic context structure
      contextJson = {
        projectSummary: projectDescription,
        techStack: "Unable to determine from provided files",
        dependencies: dependencies,
        fileStructure: fileContents.map(f => f.filename).join(", "),
        coreLogic: "Unable to analyze from provided files"
      };
    }

    return Response.json(contextJson);

  } catch (error) {
    console.error('Error in generateContext API:', error);
    return new Response('Failed to generate context', { status: 500 });
  }
}

export const runtime = "edge";