from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        try:
            self.openai_api_key = os.getenv("OPENAI_API_KEY")
            if not self.openai_api_key:
                raise ValueError("OPENAI_API_KEY environment variable is not set")

            self.embeddings = OpenAIEmbeddings(openai_api_key=self.openai_api_key)
            self.llm = ChatOpenAI(
                openai_api_key=self.openai_api_key,
                model_name="gpt-4",
                temperature=0.7
            )
            
            # Initialize vector store
            self.vector_store = Chroma(
                persist_directory="./data/vectorstore",
                embedding_function=self.embeddings
            )

            # Custom prompt template
            self.prompt_template = PromptTemplate(
                input_variables=["context", "question", "chat_history"],
                template="""You are an AI project management assistant with direct access to project data. You should provide specific information about projects when available, not just instructions on how to find it.

                When project information is available in the context, use it to give specific answers about the project's details, tasks, and status. Don't tell users to navigate the UI - you have direct access to the information.

                Current Project Context:
                {context}

                Chat History:
                {chat_history}

                Question: {question}

                Answer:"""
            )

            # Initialize conversation chain
            self.conversation_chain = ConversationalRetrievalChain.from_llm(
                llm=self.llm,
                retriever=self.vector_store.as_retriever(),
                memory=ConversationBufferMemory(
                    memory_key="chat_history",
                    return_messages=True
                ),
                combine_docs_chain_kwargs={"prompt": self.prompt_template}
            )
            self.is_openai_available = True
        except Exception as e:
            print(f"Failed to initialize OpenAI services: {str(e)}")
            self.is_openai_available = False

    async def add_to_memory(self, project_id: str, user_message: str, assistant_message: str):
        """Add a conversation to the vector store for future reference."""
        # Create a document with metadata
        doc = f"Project {project_id}: User: {user_message}\nAssistant: {assistant_message}"
        metadata = {
            "project_id": project_id,
            "type": "conversation"
        }
        
        # Add to vector store
        self.vector_store.add_texts(
            texts=[doc],
            metadatas=[metadata]
        )
        self.vector_store.persist()

    async def get_response(self, project_id: str, user_message: str, project_context: Optional[str] = None) -> str:
        """Get a response from the AI assistant based on the user's message and project context."""
        try:
            # Add project context to the query
            context = project_context if project_context else "No specific project context available."
            
            # Get response from conversation chain
            response = self.conversation_chain({
                "question": user_message,
                "context": context
            })
            
            # Store the conversation in memory
            await self.add_to_memory(project_id, user_message, response["answer"])
            
            return response["answer"]
        except Exception as e:
            print(f"Error getting AI response: {str(e)}")
            # If we have project context, return it without the error message
            if project_context:
                return project_context.strip()
            return "I apologize, but I encountered an error processing your request. Please try again later."

    async def search_project_history(self, project_id: str, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search through project history for relevant information."""
        # Add project filter to query
        search_query = f"Project {project_id}: {query}"
        
        # Search vector store
        results = self.vector_store.similarity_search_with_score(
            search_query,
            k=k,
            filter={"project_id": project_id}
        )
        
        return [
            {
                "content": doc.page_content,
                "score": score,
                "metadata": doc.metadata
            }
            for doc, score in results
        ] 