"""
CrewAI Content Generation Crew
Multi-agent system for generating high-quality content
"""

import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional
from crewai import Agent, Task, Crew, Process, LLM
from pydantic import BaseModel


class ContentGenerationInput(BaseModel):
    """Input model for content generation"""
    topic: str
    content_type: str
    format: str
    context: Dict[str, Any] = {}
    language: str = "de-CH"


class ContentCrew:
    """Content Generation Crew using CrewAI"""

    def __init__(self):
        # Load YAML configs
        # Path is relative to this file: crew/content_crew.py -> config/agents.yaml
        base_dir = Path(__file__).parent.parent
        config_dir = base_dir / "config"
        agents_path = config_dir / "agents.yaml"
        tasks_path = config_dir / "tasks.yaml"
        
        if not agents_path.exists():
            raise FileNotFoundError(f"Agents config not found at {agents_path}")
        if not tasks_path.exists():
            raise FileNotFoundError(f"Tasks config not found at {tasks_path}")
        
        with open(agents_path, 'r', encoding='utf-8') as f:
            self.agents_config = yaml.safe_load(f)
        
        with open(tasks_path, 'r', encoding='utf-8') as f:
            self.tasks_config = yaml.safe_load(f)
        
        # Load LLM configuration from environment
        self.llm_provider = os.getenv("CREWAI_LLM_PROVIDER", "openai")
        self.llm_model = os.getenv("CREWAI_MODEL", "gpt-4o")
        self.llm_api_key = os.getenv("CREWAI_LLM_API_KEY") or os.getenv("OPENAI_API_KEY")
        
        # Configure LLM based on provider
        if self.llm_provider == "openai":
            self.llm = LLM(model=self.llm_model)
        elif self.llm_provider == "anthropic":
            self.llm = LLM(model="claude-sonnet-4-5-20250929")
        else:
            # Default to OpenAI
            self.llm = LLM(model=self.llm_model)
        
        # Initialize agents (cached)
        self._researcher = None
        self._writer = None
        self._editor = None

    def researcher(self) -> Agent:
        """Research agent that gathers information"""
        if self._researcher is None:
            self._researcher = Agent(
                **self.agents_config['researcher'],
                llm=self.llm,
                verbose=True,
                allow_delegation=False,
                max_iter=10,
                max_rpm=10
            )
        return self._researcher

    def writer(self) -> Agent:
        """Writer agent that creates content"""
        if self._writer is None:
            self._writer = Agent(
                **self.agents_config['writer'],
                llm=self.llm,
                verbose=True,
                allow_delegation=False,
                max_iter=15,
                max_rpm=10
            )
        return self._writer

    def editor(self) -> Agent:
        """Editor agent that refines content"""
        if self._editor is None:
            self._editor = Agent(
                **self.agents_config['editor'],
                llm=self.llm,
                verbose=True,
                allow_delegation=False,
                max_iter=10,
                max_rpm=10
            )
        return self._editor

    def _create_tasks(self, inputs: Dict[str, Any]) -> tuple[Task, Task, Task]:
        """Create tasks with formatted inputs"""
        # Prepare safe format inputs (handle missing keys)
        # Convert context to string if it's a dict
        context_val = inputs.get('context', '')
        if isinstance(context_val, dict):
            context_val = ", ".join([f"{k}: {v}" for k, v in context_val.items()])
        elif not isinstance(context_val, str):
            context_val = str(context_val)
        
        safe_inputs = {
            'topic': inputs.get('topic', ''),
            'content_type': inputs.get('content_type', 'content'),
            'format': inputs.get('format', ''),
            'context': context_val,
            'language': inputs.get('language', 'de-CH')
        }
        
        # Research task
        research_config = self.tasks_config['research_task'].copy()
        try:
            research_config['description'] = research_config['description'].format(**safe_inputs)
            research_config['expected_output'] = research_config['expected_output'].format(**safe_inputs)
        except KeyError as e:
            # If format string has missing keys, use as-is
            pass
        
        research_task = Task(
            **research_config,
            agent=self.researcher()
        )
        
        # Writing task
        writing_config = self.tasks_config['writing_task'].copy()
        try:
            writing_config['description'] = writing_config['description'].format(**safe_inputs)
            writing_config['expected_output'] = writing_config['expected_output'].format(**safe_inputs)
        except KeyError as e:
            pass
        
        writing_task = Task(
            **writing_config,
            agent=self.writer(),
            context=[research_task]
        )
        
        # Editing task
        editing_config = self.tasks_config['editing_task'].copy()
        try:
            editing_config['description'] = editing_config['description'].format(**safe_inputs)
            editing_config['expected_output'] = editing_config['expected_output'].format(**safe_inputs)
        except KeyError as e:
            pass
        
        editing_task = Task(
            **editing_config,
            agent=self.editor(),
            context=[writing_task]
        )
        
        return research_task, writing_task, editing_task

    def crew(self, inputs: Dict[str, Any]) -> Crew:
        """Create and configure the crew"""
        # Create tasks with inputs
        research_task, writing_task, editing_task = self._create_tasks(inputs)
        
        return Crew(
            agents=[self.researcher(), self.writer(), self.editor()],
            tasks=[research_task, writing_task, editing_task],
            process=Process.sequential,
            verbose=True,
            memory=True,
            cache=True,
            max_rpm=10
        )

    def generate_content(
        self,
        topic: str,
        content_type: str,
        format: str,
        context: Dict[str, Any] = None,
        language: str = "de-CH"
    ) -> Dict[str, Any]:
        """
        Generate content using the crew
        
        Args:
            topic: The topic to write about
            content_type: Type of content (marketing, agent-prompt, documentation, report)
            format: Format specification (blog-post, system-prompt, etc.)
            context: Additional context dictionary
            language: Language code (de-CH, en-US, fr-CH)
            
        Returns:
            Dictionary with generated content and metadata
        """
        if context is None:
            context = {}
        
        # Prepare inputs for the crew
        inputs = {
            "topic": topic,
            "content_type": content_type,
            "format": format,
            "context": str(context) if context else "",
            "language": language
        }
        
        try:
            # Execute the crew
            result = self.crew(inputs).kickoff(inputs=inputs)
            
            # Extract content from result
            content = result.raw if hasattr(result, 'raw') else str(result)
            
            # Get task outputs for metadata
            task_outputs = {}
            if hasattr(result, 'tasks_output'):
                task_outputs = result.tasks_output
            
            # Get token usage if available
            token_usage = {}
            if hasattr(result, 'token_usage'):
                token_usage = result.token_usage
            
            return {
                "content": content,
                "metadata": {
                    "topic": topic,
                    "content_type": content_type,
                    "format": format,
                    "language": language,
                    "task_outputs": task_outputs,
                    "token_usage": token_usage
                }
            }
        except Exception as e:
            raise Exception(f"Content generation failed: {str(e)}")
