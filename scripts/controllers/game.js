var AIPlayerChaosMonkey, AIPlayerMinMax, Board, Game, LocalPlayer, Player, getRandomInt, object_keys,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

object_keys = function(object) {
  var key, _results;
  _results = [];
  for (key in object) {
    if (!__hasProp.call(object, key)) continue;
    _results.push(key);
  }
  return _results;
};

Board = (function() {
  var empty_grid;

  empty_grid = function(size) {
    var _i, _results;
    _results = [];
    for (_i = 0; 0 <= size ? _i < size : _i > size; 0 <= size ? _i++ : _i--) {
      _results.push(new Array(size));
    }
    return _results;
  };

  function Board(size) {
    size = parseInt(size, 10);
    if (size > 0) {
      this.size = size;
      this.grid = empty_grid(size);
    } else {
      throw new Error("size must be positive integer");
    }
  }

  Board.prototype.add_move = function(symbol, x, y) {
    if (this.size > 0 && (this.size > x && x >= 0) && (this.size > y && y >= 0) && this.grid[x][y] === void 0) {
      this.grid[x][y] = symbol;
      return this.grid;
    } else {
      return false;
    }
  };

  Board.prototype.check_win = function(symbol) {
    var check_vector, i, _i, _ref,
      _this = this;
    check_vector = function(start_x, start_y, dx, dy) {
      var distance, far_x, far_y, x, y, _i, _ref;
      far_x = start_x + dx * (_this.size - 1);
      far_y = start_y + dy * (_this.size - 1);
      if (far_x >= _this.size || far_x < 0 || far_y >= _this.size || far_y < 0) {
        return false;
      }
      for (distance = _i = 0, _ref = _this.size; 0 <= _ref ? _i < _ref : _i > _ref; distance = 0 <= _ref ? ++_i : --_i) {
        x = start_x + dx * distance;
        y = start_y + dy * distance;
        if (_this.grid[x][y] !== symbol) {
          return false;
        }
      }
      return true;
    };
    if (this.size > 0 && this.grid.length > 0) {
      if (check_vector(0, 0, 1, 1) || check_vector(this.size - 1, 0, -1, 1)) {
        return true;
      }
      for (i = _i = 0, _ref = this.size; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (check_vector(0, i, 1, 0) || check_vector(i, 0, 0, 1)) {
          return true;
        }
      }
    }
  };

  Board.prototype.check_full = function() {
    var item, row, _i, _j, _len, _len1, _ref;
    _ref = this.grid;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      row = _ref[_i];
      for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
        item = row[_j];
        if (item === void 0) {
          return false;
        }
      }
    }
    return true;
  };

  return Board;

})();

Player = (function() {

  function Player(symbol, onmove) {
    this.symbol = symbol;
    this.active = false;
    this.onmove = onmove;
    this.x = 0;
    this.y = 0;
    this.resigned = false;
  }

  Player.prototype.attempt_move = function() {
    if ((this.onmove != null) && typeof this.onmove === 'function') {
      return this.onmove({
        symbol: this.symbol,
        x: this.x,
        y: this.y,
        resigned: this.resigned
      });
    }
  };

  Player.prototype.decide_move = function(board_grid) {};

  Player.prototype.move = function(board_grid) {
    this.active = true;
    return this.decide_move(board_grid);
  };

  return Player;

})();

LocalPlayer = (function(_super) {

  __extends(LocalPlayer, _super);

  function LocalPlayer() {
    return LocalPlayer.__super__.constructor.apply(this, arguments);
  }

  LocalPlayer.prototype.accepts_clicks = true;

  return LocalPlayer;

})(Player);

AIPlayerChaosMonkey = (function(_super) {

  __extends(AIPlayerChaosMonkey, _super);

  function AIPlayerChaosMonkey() {
    return AIPlayerChaosMonkey.__super__.constructor.apply(this, arguments);
  }

  AIPlayerChaosMonkey.prototype.decide_move = function(board_grid) {
    var result;
    while (!result) {
      this.x = getRandomInt(0, board_grid.length - 1);
      this.y = getRandomInt(0, board_grid.length - 1);
      result = this.attempt_move();
    }
    return result;
  };

  return AIPlayerChaosMonkey;

})(Player);

AIPlayerMinMax = (function(_super) {

  __extends(AIPlayerMinMax, _super);

  function AIPlayerMinMax() {
    return AIPlayerMinMax.__super__.constructor.apply(this, arguments);
  }

  AIPlayerMinMax.prototype.decide_move = function(board_grid) {
    var analyze_point, analyze_point_as, analyze_vector_as, i, item, k, max_value, move, players, possible_moves, row, size, value, _i, _j, _k, _len, _len1, _len2;
    size = board_grid.length;
    players = {};
    possible_moves = [];
    for (i = _i = 0, _len = board_grid.length; _i < _len; i = ++_i) {
      row = board_grid[i];
      for (k = _j = 0, _len1 = row.length; _j < _len1; k = ++_j) {
        item = row[k];
        if (!item) {
          possible_moves.push([i, k]);
        } else if (item !== this.symbol) {
          players[item] = true;
        }
      }
    }
    players = object_keys(players);
    players.push(this.symbol);
    analyze_vector_as = function(symbol, start_x, start_y, dx, dy) {
      var distance, result, x, y;
      distance = 0;
      result = 0;
      while (distance < size) {
        x = start_x + dx * distance;
        y = start_y + dy * distance;
        if (!board_grid[x][y]) {
          result += 1;
        } else if (board_grid[x][y] === symbol) {
          result += 3;
        } else {
          return 0;
        }
        distance++;
      }
      if (result === ((size - 1) * 3 + 1)) {
        result *= 3;
      }
      return result;
    };
    analyze_point_as = function(symbol, x, y) {
      var result;
      result = 0;
      result += analyze_vector_as(symbol, 0, y, 1, 0);
      result += analyze_vector_as(symbol, x, 0, 0, 1);
      if (x === y) {
        result += analyze_vector_as(symbol, 0, 0, 1, 1);
      }
      if ((x + y) === (size - 1)) {
        result += analyze_vector_as(symbol, size - 1, 0, -1, 1);
      }
      return result;
    };
    analyze_point = function(x, y) {
      var result, symbol, _k, _len2;
      result = 0;
      for (_k = 0, _len2 = players.length; _k < _len2; _k++) {
        symbol = players[_k];
        result = Math.max(result, analyze_point_as(symbol, x, y));
      }
      return result;
    };
    max_value = -1;
    for (_k = 0, _len2 = possible_moves.length; _k < _len2; _k++) {
      move = possible_moves[_k];
      if ((value = analyze_point(move[0], move[1])) > max_value) {
        this.x = move[0], this.y = move[1];
        max_value = value;
      }
    }
    return this.attempt_move();
  };

  return AIPlayerMinMax;

})(Player);

Game = (function() {

  Game.possible_types = ['hotseat', 'you vs chaos', 'you vs pc'];

  Game.possible_players = "xo";

  function Game(board_size, game_type) {
    if (__indexOf.call(Game.possible_types, game_type) < 0) {
      throw Error("game_type must be one of" + Game.possible_types.join(', '));
    }
    board_size = parseInt(board_size, 10);
    if (!(board_size > 0)) {
      throw Error("board_size must be positive integer");
    }
    this.finished = false;
    this.board = new Board(board_size);
    this.type = game_type;
    this.players = [];
    this.active_player_index = -1;
    this.active_player = null;
    this.winner = void 0;
    this.moves = [];
    this.fill_players();
  }

  Game.prototype.fill_players = function(game_type) {
    var available_symbols, move_handler, next_random_symbol,
      _this = this;
    available_symbols = Game.possible_players.split('');
    move_handler = (function(move) {
      return _this.accept_move(move);
    });
    next_random_symbol = function() {
      return available_symbols.splice(getRandomInt(0, available_symbols.length - 1), 1)[0];
    };
    switch (this.type) {
      case 'hotseat':
        while (available_symbols.length > 0) {
          this.players.push(new LocalPlayer(next_random_symbol(), move_handler));
        }
        break;
      case 'you vs chaos':
        this.players.push(new LocalPlayer(next_random_symbol(), move_handler));
        while (available_symbols.length > 0) {
          this.players.push(new AIPlayerChaosMonkey(next_random_symbol(), move_handler));
        }
        break;
      case 'you vs pc':
        this.players.push(new LocalPlayer(next_random_symbol(), move_handler));
        while (available_symbols.length > 0) {
          this.players.push(new AIPlayerMinMax(next_random_symbol(), move_handler));
        }
    }
    this.start_game();
    return this.players;
  };

  Game.prototype.start_game = function() {
    if (this.players.length < 2) {
      throw Error("not enough players to start");
    }
    this.started = (new Date()).getTime();
    return this.next_move();
  };

  Game.prototype.onmoveaccepted = void 0;

  Game.prototype.accept_move = function(move) {
    if (!this.finished) {
      if ((move.symbol != null) && (move.x != null) && (move.y != null)) {
        if (move.symbol === this.active_player.symbol) {
          if (this.board.add_move(move.symbol, move.x, move.y)) {
            this.moves.push({
              at: (new Date()).getTime(),
              symbol: move.symbol,
              x: move.x,
              y: move.y
            });
            if (this.board.check_win(move.symbol)) {
              this.finished = true;
              this.winner = move.symbol;
            } else if (this.board.check_full()) {
              this.finished = true;
              this.winner = void 0;
            } else {
              this.next_move();
            }
            if ((this.onmoveaccepted != null) && typeof this.onmoveaccepted === 'function') {
              this.onmoveaccepted();
            }
            return this.board.grid;
          }
        }
      }
    }
  };

  Game.prototype.next_player = function() {
    if (this.players.length > 0) {
      this.active_player_index = ++this.active_player_index % this.players.length;
      return this.active_player = this.players[this.active_player_index];
    }
  };

  Game.prototype.next_move = function() {
    var _this = this;
    return setTimeout((function() {
      return _this.next_player().move(_this.board.grid);
    }), 0);
  };

  return Game;

})();

angular.module('asArtApp').controller('GameCtrl', function($scope) {
  $scope.game_types = Game.possible_types;
  $scope.create_new_game = function() {
    $scope.game = new Game($scope.new_game.size, $scope.new_game.type);
    return $scope.game.onmoveaccepted = function() {
      return $scope.$apply();
    };
  };
  return $scope.local_player_move = function(x, y) {
    if (($scope.game != null) && $scope.game.active_player.accepts_clicks) {
      $scope.game.active_player.x = x;
      $scope.game.active_player.y = y;
      return $scope.game.active_player.attempt_move();
    }
  };
});