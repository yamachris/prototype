import { PrismaClient } from '@prisma/client';
import { cardService } from './services/cardService';
import { gameLogicService } from './services/gameLogicService';
import { PlayerAction } from './types/gameTypes';

const prisma = new PrismaClient();

async function soloDemo() {
    try {
        console.log('🎮 Démo du mode Solo\n');

        // 0. Créer l'IA si elle n'existe pas
        console.log('0️⃣ Vérification/Création de l\'IA...');
        let aiPlayer = await prisma.user.findFirst({
            where: { isAI: true }
        });

        if (!aiPlayer) {
            aiPlayer = await prisma.user.create({
                data: {
                    username: 'AI_PLAYER',
                    email: 'ai@system.local',
                    password: 'not_needed',
                    isAI: true
                }
            });
        }
        console.log('✅ IA prête\n');

        // 1. Créer le joueur (ou utiliser un existant)
        console.log('1️⃣ Création du joueur...');
        const player = await prisma.user.create({
            data: {
                username: 'joueur_solo',
                email: 'solo@test.com',
                password: 'test123',
                isAI: false
            }
        });
        console.log(`✅ Joueur créé: ${player.username}\n`);

        // 2. Créer une nouvelle partie solo.
        console.log('2️⃣ Création d\'une nouvelle partie solo...');
        const game = await gameLogicService.initializeGame(player.id, aiPlayer.id);
        console.log(`✅ Partie créée avec l'ID: ${game.id}\n`);

        // 3. Simuler quelques tours de jeu
        console.log('3️⃣ Simulation de quelques tours...');
        const gameState = game.gameState as any;
        
        // Le joueur joue une carte
        const card1 = gameState.player1Hand[0];
        const action1: PlayerAction = {
            type: 'CARD_PLAY',
            cards: [card1],
            column: card1.suit,
            playerId: player.id
        };
        await gameLogicService.processGameAction(game.id, player.id, action1);
        console.log('✅ Joueur a joué une carte\n');

        // 4. Simuler une fermeture de page
        console.log('4️⃣ Simulation de la fermeture de la page...');
        
        // Au lieu de mettre en pause, on continue le jeu
        // L'IA joue automatiquement pendant que le joueur est absent
        for (let i = 0; i < 3; i++) {
            const currentGame = await prisma.game.findUnique({
                where: { id: game.id }
            });
            const currentState = currentGame?.gameState as any;
            
            // L'IA joue automatiquement
            if (currentState.currentPlayer === aiPlayer.id) {
                const aiCard = currentState.player2Hand[0];
                const aiAction: PlayerAction = {
                    type: 'CARD_PLAY',
                    cards: [aiCard],
                    column: aiCard.suit,
                    playerId: aiPlayer.id
                };
                await gameLogicService.processGameAction(game.id, aiPlayer.id, aiAction);
                console.log('🤖 L\'IA a joué pendant l\'absence du joueur');
            }
        }
        console.log('✅ Le jeu a continué pendant l\'absence du joueur\n');

        // 5. Le joueur "revient" - on récupère l'état actuel
        console.log('5️⃣ Le joueur revient - récupération de l\'état...');
        const currentGame = await prisma.game.findUnique({
            where: { id: game.id },
            include: {
                actions: {
                    orderBy: { timestamp: 'desc' },
                    take: 5
                }
            }
        });

        console.log('\nÉtat actuel de la partie:');
        console.log('------------------------');
        console.log(`Tour actuel: ${currentGame?.currentTurn}`);
        console.log('\nDernières actions pendant l\'absence:');
        currentGame?.actions.forEach(action => {
            const player = action.playerId === aiPlayer?.id ? 'IA' : 'Joueur';
            console.log(`- ${player} a fait ${action.actionType} au tour ${action.turnNumber}`);
        });

        // 6. Vérifier si la partie doit se terminer (limite de temps/tours)
        const MAX_TURNS = 30; // Par exemple, limite de 30 tours
        if (currentGame && currentGame.currentTurn >= MAX_TURNS) {
            await prisma.game.update({
                where: { id: game.id },
                data: { 
                    status: 'COMPLETED',
                    endedAt: new Date()
                }
            });
            console.log('\n⚠️ La partie s\'est terminée car la limite de tours a été atteinte');
        }

        // 7. Statistiques de la partie
        const stats = await prisma.playerStats.findFirst({
            where: { 
                gameId: game.id,
                playerId: player.id
            }
        });

        console.log('\nStatistiques du joueur:');
        console.log('----------------------');
        console.log(`Cartes jouées: ${stats?.cardsPlayed}`);
        console.log(`Points gagnés: ${stats?.pointsEarned}`);

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        // Nettoyage pour la démo
        await prisma.gameAction.deleteMany();
        await prisma.playerStats.deleteMany();
        await prisma.gameSnapshot.deleteMany();
        await prisma.gameSession.deleteMany();
        await prisma.game.deleteMany();
        await prisma.user.deleteMany();
        await prisma.$disconnect();
    }
}

// Lancer la démo
soloDemo();
