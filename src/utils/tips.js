export const DINDIN_TIPS = {
    subscriptions: [
        "Identifique 'taxas vampiras' — serviços que você paga mas não usa mais.",
        "Tente manter seu custo fixo abaixo de 10% da sua receita mensal.",
        "Use o período de teste gratuito mas coloque um lembrete para cancelar 1 dia antes.",
        "Compartilhar planos familiares pode reduzir custos em até 70%.",
        "Revise se você realmente precisa do plano 4K ou se o HD já atende sua tela.",
        "Assinaturas anuais costumam ser 20% mais baratas que as mensais.",
        "Cancele e assine conforme a demanda (ex: assine HBO apenas quando sair sua série).",
        "Muitos cartões de crédito oferecem cashback ou descontos em streamings específicos.",
        "Verifique se seu plano de celular ou internet já inclui algum serviço de vídeo.",
        "Se não usou o serviço nos últimos 30 dias, considere seriamente o cancelamento."
    ],
    investments: [
        "Pague-se primeiro: transfira para o investimento assim que receber o salário.",
        "A constância vale mais que o valor: R$ 50 todo mês é melhor que R$ 500 uma vez por ano.",
        "Tenha uma reserva de emergência antes de buscar maior rentabilidade.",
        "Reduzir gastos pequenos hoje pode significar uma aposentadoria muito mais tranquila.",
        "O melhor momento para começar a poupar era ontem, o segundo melhor é hoje.",
        "Diversifique seus 'potes' de poupança para diferentes objetivos (viagem, casa, reserva).",
        "Automatize seus investimentos para evitar a tentação de gastar o dinheiro.",
        "Lembre-se: investimento não é gasto, é seu futuro comprando sua liberdade.",
        "Estude sobre juros compostos; eles são a oitava maravilha do mundo financeiro.",
        "Antes de investir pesado, procure liquidar dívidas com juros altos."
    ],
    cards: [
        "O cartão de crédito é ferramenta de fluxo de caixa, não extensão do salário.",
        "Evite o pagamento mínimo; os juros do rotativo são os maiores do mercado.",
        "Centralize gastos em um único cartão para facilitar o controle e acumular pontos.",
        "Ajuste seu limite para um valor que você consiga pagar sem aperto.",
        "Use notificações em tempo real no app do banco para não ter surpresas.",
        "Anote todos os gastos, inclusive os parcelados, para saber seu compromisso futuro.",
        "Se não conseguir pagar a fatura total, procure um crédito com juros menores.",
        "Verifique sempre se há cobrança de anuidade e tente negociar a isenção.",
        "Use cartões virtuais para compras online; é muito mais seguro contra fraudes.",
        "O dia de fechamento é seu melhor aliado para ganhar fôlego financeiro."
    ],
    general: [
        "A regra 50-30-20 é um ótimo começo: 50% necessidades, 30% desejos, 20% poupança.",
        "Pequenos gastos diários (como o cafezinho) podem somar centenas de reais no mês.",
        "Use tags para categorizar melhor onde seu dinheiro está indo.",
        "Planeje compras grandes com antecedência para conseguir melhores preços à vista.",
        "Ter clareza visual de onde você gasta é o primeiro passo para o controle.",
        "Não compare seu capítulo 1 com o capítulo 20 de outra pessoa.",
        "O Dindin é seu mapa, mas quem segura o volante é você!",
        "Revise seu orçamento semanalmente para não perder o controle.",
        "Se você não consegue medir, você não consegue gerenciar.",
        "Dinheiro é um excelente escravo, mas um mestre terrível."
    ]
};

export const getRandomTip = (category = 'general') => {
    const categoryTips = DINDIN_TIPS[category] || DINDIN_TIPS.general;
    const randomIndex = Math.floor(Math.random() * categoryTips.length);
    return categoryTips[randomIndex];
};
