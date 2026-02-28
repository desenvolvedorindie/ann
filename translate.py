import os

replacements = {
    # Long strings first to avoid partial replacements
    "Você soltou ": "You dropped ",
    " com a tecla ": " with the ",
    " pressionada. Quantos nós deseja empilhar?" : " key pressed. How many nodes do you want to stack?",
    "<b>Dica:</b> Segure <kbd className=\"px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono\">Ctrl</kbd> ao soltar para adicionar múltiplos elementos.": "<b>Tip:</b> Hold <kbd className=\"px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono\">Ctrl</kbd> when dropping to add multiple elements.",
    "Esta conexão funciona apenas para leitura de valor. Ela lê o que saiu do neurônio conectado sem calcular nenhum peso extra.": "This connection only works for value reading. It reads what came out of the connected neuron without calculating any extra weight.",
    "Clique para selecionar o neurônio de Origem": "Click to select the Source neuron",
    "Clique para selecionar o neurônio de Destino": "Click to select the Target neuron",
    "Existem alterações não salvas. Deseja descartá-las?": "There are unsaved changes. Do you want to discard them?",
    "A base de dados não pode ficar vazia.": "The dataset cannot be empty.",
    "Se era um dataset novo que foi cancelado antes de salvar": "If it was a new dataset that was canceled before saving",
    "Se o dataset existente estava vazio quando clicou em editar e cancelou": "If the existing dataset was empty when clicked edit and canceled",
    "Filtro para visualização da fatia": "Filter for slice visualization",
    "Selecionar Conexão (Sinapse)": "Select Connection (Synapse)",
    "Padrões (Portas Lógicas)": "Patterns (Logic Gates)",
    "Distribuição Gráfica (2D)": "Plot Distribution (2D)",
    "Origem (Pré)": "Source (Pre)",
    "Destino (Pós)": "Target (Post)",
    "Conexão de Saída": "Output Connection",
    "Selecionar Neurônio": "Select Neuron",
    "Erro por Época": "Error per Epoch",
    "Superfície de Erro": "Error Surface",
    "Métricas Globais": "Global Metrics",
    "Época Atual": "Current Epoch",
    "Criação em Lote": "Batch Creation",
    "Criar Nós": "Create Nodes",
    "Nenhuma ação ainda": "No actions yet",
    "Tabela Verdade": "Truth Table",
    "Porta Lógica:": "Logic Gate:",
    "Saída (Cores):": "Output (Colors):",
    "Coluna de Saída (Y)": "Output Column (Y)",
    "Adicionar Linha": "Add Row",
    "title=\"Fechar\"": "title=\"Close\"",
    "title=\"Deletar Matriz\"": "title=\"Delete Matrix\"",
    "title=\"Limpar Desenho\"": "title=\"Clear Drawing\"",
    "title=\"Deletar camada\"": "title=\"Delete layer\"",
    "Deletar": "Delete",
    "Histórico": "History",
    "Cancelar": "Cancel",
    "Salvar": "Save",
    "Editar": "Edit",
    "Adicionar": "Add",
    "Saída": "Output",
    "nó(s)": "node(s)",
    "camada": "layer",
    "Mover": "Move",
    "Pausar": "Pause",
    "Continuar": "Continue",
    "Executar": "Execute",
    "Novo": "New",
    "Carregar": "Load",
    "neurônio": "neuron",
    "neurônios": "neurons"
}

# Process specific directories containing code
def process_dir(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                orig_content = content
                
                # Special cases to avoid overwriting logic
                if 'Saída' in content: 
                   content = content.replace('Saída', 'Output')
                   
                for k, v in replacements.items():
                    content = content.replace(k, v)
                    
                if content != orig_content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)

process_dir('d:\\Projetos\\ann\\src')
