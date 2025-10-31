// Attendre que le document soit prêt
$(document).ready(function() {
    
    // --- PARTIE 1: LE CHATBOT ET L'ÉCHIQUIER D'EXPLICATION ---
    
    var boardExplain = null; // L'échiquier d'explication
    var chatBox = $('#chatBox');
    var userInput = $('#userInput');
    
    // Initialise l'échiquier d'explication (vide au début)
    boardExplain = Chessboard('boardExplanation', 'clear'); 
    
    // Notre "base de données" de réponses
    var expertAnswers = {
        "ruy lopez": {
            text: "Le Ruy Lopez (ou partie Espagnole) est l'une des ouvertures les plus populaires. Elle commence par 1. e4 e5 2. Cf3 Cc6 3. Fb5.",
            fen: "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 3"
        },
        "gambit dame": {
            text: "Le Gambit Dame commence par 1. d4 d5 2. c4. Les blancs offrent un pion pour contrôler le centre.",
            fen: "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 2"
        },
        "mat du couloir": {
            text: "Le mat du couloir arrive quand une Tour ou une Dame attaque le roi sur la dernière rangée, et que le roi est bloqué par ses propres pions.",
            fen: "6k1/8/8/8/8/8/8/R7 w - - 0 1" // Ceci est un exemple, on va le mettre en position de mat
        },
        "bonjour": {
            text: "Bonjour ! En quoi puis-je vous aider sur les échecs ?",
            fen: "clear"
        }
        // ... ajoutez autant de mots-clés que vous voulez
    };

    // Gérer l'envoi de message
    $('#sendButton').on('click', function() {
        var query = userInput.val().toLowerCase();
        if (query === "") return;

        // Afficher le message de l'utilisateur
        chatBox.append('<p class="user-message"><strong>Vous:</strong> ' + query + '</p>');
        userInput.val(""); // Vider l'input

        // Chercher une réponse
        var foundAnswer = null;
        for (var keyword in expertAnswers) {
            if (query.includes(keyword)) {
                foundAnswer = expertAnswers[keyword];
                break;
            }
        }

        // Afficher la réponse du bot
        if (foundAnswer) {
            chatBox.append('<p class="bot-message"><strong>Expert:</strong> ' + foundAnswer.text + '</p>');
            // Mettre à jour l'échiquier d'explication
            if (foundAnswer.fen === "clear") {
                boardExplain.clear();
            } else {
                boardExplain.position(foundAnswer.fen);
            }
        } else {
            chatBox.append('<p class="bot-message"><strong>Expert:</strong> Désolé, je ne connais pas ce sujet. Essayez "Ruy Lopez" ou "Gambit Dame".</p>');
            boardExplain.clear();
        }
        
        // Scroller le chat en bas
        chatBox.scrollTop(chatBox[0].scrollHeight);
    });

});
