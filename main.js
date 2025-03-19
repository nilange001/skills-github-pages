
require('dotenv').config();

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const token = process.env.DISCORD_TOKEN;

const games = new Map();

const emptyBoard = {
    'A1': '⬜', 'A2': '⬜', 'A3': '⬜',
    'B1': '⬜', 'B2': '⬜', 'B3': '⬜',
    'C1': '⬜', 'C2': '⬜', 'C3': '⬜'
};

client.on('ready', () => {
    console.log(`Bot is ready as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!tictactoe help') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('TicTacToe Help')
            .setDescription(
                'How to play:\n' +
                '1. Type `!tictactoe start @player` to start a game\n' +
                '2. Use coordinates to place your mark (e.g., `!play A1`)\n' +
                '3. Valid coordinates are A1-A3, B1-B3, C1-C3\n' +
                '4. First player uses ❌, second player uses ⭕\n' +
                '5. Get three in a row to win!'
            )
            .setColor('#00ff00');
        message.channel.send({ embeds: [helpEmbed] });
        return;
    }

    if (message.content.startsWith('!tictactoe start')) {
        const opponent = message.mentions.users.first();
        if (!opponent) {
            message.reply('Please mention a player to start the game with!');
            return;
        }

        const gameState = {
            board: { ...emptyBoard },
            players: [message.author.id, opponent.id],
            currentPlayer: 0
        };

        games.set(message.channel.id, gameState);
        displayBoard(message.channel, gameState);
        return;
    }

    if (message.content.startsWith('!play')) {
        const gameState = games.get(message.channel.id);
        if (!gameState) {
            message.reply('No active game in this channel. Start one with `!tictactoe start @player`');
            return;
        }

        const position = message.content.split(' ')[1]?.toUpperCase();
        if (!gameState.board.hasOwnProperty(position)) {
            message.reply('Invalid position! Use A1-A3, B1-B3, or C1-C3');
            return;
        }

        if (message.author.id !== gameState.players[gameState.currentPlayer]) {
            message.reply('It\'s not your turn!');
            return;
        }

        if (gameState.board[position] !== '⬜') {
            message.reply('That position is already taken!');
            return;
        }

        gameState.board[position] = gameState.currentPlayer === 0 ? '❌' : '⭕';
        gameState.currentPlayer = gameState.currentPlayer === 0 ? 1 : 0;

        const winner = checkWinner(gameState.board);
        if (winner) {
            displayBoard(message.channel, gameState);
            message.channel.send(`Game Over! ${winner === 'tie' ? 'It\'s a tie!' : `<@${gameState.players[winner === '❌' ? 0 : 1]}> wins!`}`);
            games.delete(message.channel.id);
            return;
        }

        displayBoard(message.channel, gameState);
    }


    if (message.content.startsWith('!exit')) {
        const gameState = games.get(message.channel.id);
        if (!gameState) {
            message.reply('No active game in this channel.');
            return;
        }

        games.delete(message.channel.id);
        message.channel.send('The game has been exited.');
    }

});

function displayBoard(channel, gameState) {
    const board = gameState.board;
    const boardDisplay = 
        `Current player: <@${gameState.players[gameState.currentPlayer]}>\n\n` +
        `   1️⃣  2️⃣  3️⃣\n` +
        `A  ${board.A1}${board.A2}${board.A3}\n` +
        `B  ${board.B1}${board.B2}${board.B3}\n` +
        `C  ${board.C1}${board.C2}${board.C3}`;
    
    channel.send(boardDisplay);
}

function checkWinner(board) {
    const lines = [
        ['A1', 'A2', 'A3'], ['B1', 'B2', 'B3'], ['C1', 'C2', 'C3'], // rows
        ['A1', 'B1', 'C1'], ['A2', 'B2', 'C2'], ['A3', 'B3', 'C3'], // columns
        ['A1', 'B2', 'C3'], ['A3', 'B2', 'C1'] // diagonals
    ];

    for (const line of lines) {
        if (board[line[0]] !== '⬜' &&
            board[line[0]] === board[line[1]] &&
            board[line[1]] === board[line[2]]) {
            return board[line[0]];
        }
    }

    if (!Object.values(board).includes('⬜')) {
        return 'tie';
    }

    return null;
}

client.login(token);