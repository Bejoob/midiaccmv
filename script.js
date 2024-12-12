function verificarDatasPassadas() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Seleciona todas as seções de mês
    const secoesMes = document.querySelectorAll('section.mes');
    
    secoesMes.forEach(secao => {
        const linhasTabela = secao.querySelectorAll('tbody tr');
        
        linhasTabela.forEach(linha => {
            const dataTexto = linha.querySelector('td:first-child').textContent;
            const [dia, mes, ano] = dataTexto.split('/').map(num => parseInt(num, 10));
            const dataLinha = new Date(ano, mes - 1, dia); // mes - 1 porque em JS os meses começam do 0
            dataLinha.setHours(0, 0, 0, 0);
            
            // Adiciona a classe se a data já passou
            if (dataLinha < hoje) {
                linha.classList.add('data-passada');
            }
        });
    });
}

// Executa quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', () => {
    verificarDatasPassadas();
});