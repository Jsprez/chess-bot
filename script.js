// Attendre que le document soit prêt (jQuery)
$(document).ready(function() {
    
    // --- PARTIE 1: LE CHATBOT ET L'ÉCHIQUIER D'EXPLICATION ---
    
    var boardExplain = null; // L'échiquier d'explication
    var chatBox = $('#chatBox');
    var userInput = $('#userInput');
    
    // Initialise l'échiquier d'explication (vide au début)
    // 'boardExplanation' est l'ID de la div dans le HTML
    boardExplain = Chessboard('boardExplanation', 'clear'); 
    
    // Notre "base de données" de réponses de l'expert
    // C'est ici que vous ajoutez toute l'expertise de votre IA
    var expertAnswers = {
        "ruy lopez": {
            text: "Le Ruy Lopez (ou partie Espagnole) est l'une des ouvertures les plus populaires. Elle commence par 1. e4 e5 2. Cf3 Cc6 3. Fb5.",
            fen: "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 3" // FEN = notation de la position
        },
        "gambit dame": {
            text: "Le Gambit Dame commence par 1. d4 d5 2. c4. Les blancs offrent un pion pour contrôler le centre.",
            fen: "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 2"
        },
        "sicilienne": {
            text: "La défense Sicilienne est la réponse la plus populaire à 1. e4. Elle commence par 1... c5 et vise à combattre pour le centre.",
            fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1"
        },
        "mat du couloir": {
            text: "Le mat du couloir arrive quand une Tour ou une Dame attaque le roi sur la dernière rangée, et que le roi est bloqué par ses propres pions.",
            fen: "6k1/8/8/8/8/8/8/R3K3 w - - 0 1" // Position d'exemple
        },
        "bonjour": {
            text: "Bonjour ! En quoi puis-je vous aider sur les échecs ? Essayez 'sicilienne' ou 'gambit dame'.",
            fen: "clear" // 'clear' vide l'échiquier
        },
        "salut": {
            text: "Bonjour ! En quoi puis-je vous aider sur les échecs ? Essayez 'sicilienne' ou 'gambit dame'.",
            fen: "clear"
        }
        // ... ajoutez autant de mots-clés que vous voulez
    };

    // Gérer l'envoi de message par clic
    $('#sendButton').on('click', function() {
        handleChatInput();
    });

    // Gérer l'envoi de message par "Entrée"
    userInput.on('keypress', function(e) {
        if (e.which == 13) { // 13 est le code pour la touche "Entrée"
            handleChatInput();
        }
    });

    // Fonction pour gérer la logique du chat
    function handleChatInput() {
        var query = userInput.val().toLowerCase().trim(); // Nettoyer l'entrée utilisateur
        if (query === "") return;

        // 1. Afficher le message de l'utilisateur
        chatBox.append('<p class="user-message"><strong>Vous:</strong> ' + query + '</p>');
        userInput.val(""); // Vider l'input

        // 2. Chercher une réponse dans notre base de données
        var foundAnswer = null;
        for (var keyword in expertAnswers) {
            // Si la question de l'utilisateur CONTIENT un mot-clé
            if (query.includes(keyword)) {
                foundAnswer = expertAnswers[keyword];
                break; // On a trouvé une réponse, on arrête de chercher
            }
        }

        // 3. Afficher la réponse du bot
        var botMessage = "";
        if (foundAnswer) {
            botMessage = foundAnswer.text;
            // Mettre à jour l'échiquier d'explication
            if (foundAnswer.fen === "clear") {
                boardExplain.clear();
            } else {
                boardExplain.position(foundAnswer.fen);
            }
        } else {
            botMessage = "Désolé, je ne connais pas ce sujet. Mes connaissances sont limitées. Essayez \"Ruy Lopez\" ou \"Gambit Dame\".";
            boardExplain.clear();
        }
        
        // Simuler un petit temps de "réflexion" de l'IA
        setTimeout(function() {
            chatBox.append('<p class="bot-message"><strong>Expert:</strong> ' + botMessage + '</p>');
            // Scroller le chat automatiquement vers le bas
            chatBox.scrollTop(chatBox[0].scrollHeight);
        }, 500); // 500ms de délai
    }


    // --- PARTIE 2: LE JEU CONTRE L'IA (STOCKFISH) ---

    var boardGame = null;       // L'échiquier de jeu (visuel)
    var game = new Chess();     // La logique de jeu (règles)
    var $status = $('#status');
    var skillLevel = 5;         // Niveau par défaut (Facile)

    // 1. Charger Stockfish
    // Stockfish.js s'exécute dans un "Worker" pour ne pas geler le navigateur
    // Nous utilisons un CDN pour charger le fichier, pas besoin de l'héberger
    var stockfish = new Worker('https://unpkg.com/stockfish@15.1.0/src/stockfish.js');

    // 2. Écouter les messages de Stockfish
    stockfish.onmessage = function(event) {
        // 'event.data' contient la réponse de Stockfish
        var message = event.data;
        
        // On cherche la ligne qui commence par "bestmove"
        if (message && message.startsWith('bestmove')) {
            var move = message.split(' ')[1]; // Extrait le coup (ex: "e7e5")
            
            // Joue le coup de l'IA sur la logique
            game.move(move, { sloppy: true });
            
            // Met à jour l'échiquier visuel
            boardGame.position(game.fen());
            
            // Met à jour le status (c'est à nouveau au tour des Blancs)
            updateStatus();
        }
    };

    // 3. Initialiser Stockfish
    stockfish.postMessage('uci'); // Commande pour démarrer le moteur
    stockfish.postMessage('isready'); // Demander quand il est prêt
    setDifficulty(); // Appliquer la difficulté par défaut

    // 4. Fonction pour changer la difficulté
    function setDifficulty() {
        skillLevel = $('#difficulty').val(); // Récupère la valeur du <select> (5, 10 ou 20)
        stockfish.postMessage('setoption name Skill Level value ' + skillLevel);
    }
    
    // 5. Écouteur d'événement sur le menu déroulant
    $('#difficulty').on('change', setDifficulty);

    // 6. Fonction appelée quand le joueur lâche une pièce
    function onDrop(source, target) {
        // Essayer de faire le coup
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q' // Promouvoir en Dame automatiquement (simplification)
        });

        // Si le coup est illégal, 'move' sera null
        if (move === null) return 'snapback'; // 'snapback' remet la pièce à sa place

        // Le coup est légal, on met à jour le status
        updateStatus();

        // C'est au tour de l'IA
        // On lui envoie la position actuelle (au format FEN)
        // et on lui demande de calculer
        stockfish.postMessage('position fen ' + game.fen());
        stockfish.postMessage('go movetime 1000'); // Laisse l'IA réfléchir 1 seconde (1000ms)
    }

    // Fonction appelée pour mettre à jour l'échiquier si le coup est invalide
    function onSnapEnd() {
        boardGame.position(game.fen());
    }

    // Fonction pour mettre à jour le statut du jeu
    function updateStatus() {
        var status = '';
        var moveColor = (game.turn() === 'b') ? 'Noirs' : 'Blancs'; // Qui doit jouer ?

        if (game.isCheckmate()) {
            status = 'Échec et Mat ! ' + (moveColor === 'Blancs' ? 'Les Noirs' : 'Les Blancs') + ' gagnent.';
        } else if (game.isDraw()) {
            status = 'Partie Nulle (pat, règle des 50 coups, 3 répétitions, etc.)';
        } else {
            status = 'Au tour des ' + moveColor;
            // Vérifier si le joueur actuel est en échec
            if (game.inCheck()) {
                status += ', ' + moveColor + ' sont en échec.';
            }
        }
        $status.text(status); // Met à jour le texte dans le HTML
    }

    // 7. Configuration de l'échiquier de jeu
    var configGame = {
        draggable: true,      // Les pièces peuvent être bougées
        position: 'start',    // Position de départ
        onDrop: onDrop,       // Fonction à appeler quand une pièce est lâchée
        onSnapEnd: onSnapEnd  // Fonction à appeler après l'animation de 'drop'
    };
    
    // 8. Initialiser l'échiquier de jeu
    boardGame = Chessboard('boardGame', configGame);
    updateStatus(); // Mettre le status initial ("Au tour des Blancs")

    // 9. Gérer le bouton Nouvelle Partie
    $('#newGameButton').on('click', function() {
        game.reset(); // Réinitialise la logique de chess.js
        boardGame.start(); // Réinitialise le visuel de chessboard.js
        updateStatus();
        stockfish.postMessage('ucinewgame'); // Dit à Stockfish de recommencer
        stockfish.postMessage('isready');
        setDifficulty(); // Ré-appliquer la difficulté
    });

// Fin du $(document).ready()
});
