getRandomInt = (min, max)->Math.floor(Math.random() * (max - min + 1)) + min
object_keys = (object)-> key for own key of object

class Board
  empty_grid = (size)-> new Array(size) for [0...size]

  constructor: (size)->
    size = parseInt(size, 10)
    if size > 0
      @size = size
      @grid = empty_grid size
    else
      throw new Error "size must be positive integer"
  
  add_move: (symbol, x, y)->
    if @size > 0 and 
     @size > x >= 0 and
     @size > y >= 0 and
     @grid[x][y] is undefined

      @grid[x][y] = symbol
      return @grid
    else
      return false
  
  check_win: (symbol)->
    check_vector = (start_x, start_y, dx, dy)=>     
      far_x = start_x + dx * (@size - 1)
      far_y = start_y + dy * (@size - 1)

      if far_x >= @size or
       far_x < 0 or
       far_y >= @size or
       far_y < 0
        return false

      for distance in [0 ... @size]
        x = start_x + dx * distance
        y = start_y + dy * distance
       
        if @grid[x][y] isnt symbol
          return false
       
      return true

    if @size > 0 and @grid.length > 0    

      return true if check_vector(0,0,1,1) or check_vector(@size-1, 0, -1, 1)
      for i in [0...@size]
        return true if check_vector(0, i, 1, 0) or check_vector(i, 0, 0, 1) 


  check_full: ->
    for row in @grid
      for item in row
        return false if item is undefined

    true

class Player
  constructor: (symbol, onmove)->
    @symbol = symbol
    @active = false
    @onmove = onmove
    @x = 0
    @y = 0
    @resigned = false

  attempt_move: ->
    if @onmove? and typeof @onmove is 'function' then @onmove {
      @symbol
      @x
      @y
      @resigned
    }

  decide_move: (board_grid)->

  move: (board_grid)->
    @active = true
    @decide_move(board_grid)

class LocalPlayer extends Player
  accepts_clicks: true

class AIPlayerChaosMonkey extends Player
  decide_move: (board_grid)->
    until result
      @x = getRandomInt 0, board_grid.length-1
      @y = getRandomInt 0, board_grid.length-1
      result = @attempt_move()

    result

class AIPlayerMinMax extends Player
  decide_move: (board_grid)->
    size = board_grid.length
    players = {}

    possible_moves = []
    for row, i in board_grid
      for item, k in row 
        if not item #an empty field
          possible_moves.push [i,k]
        else if item isnt @symbol 
          players[item] = true

    players = object_keys(players)

    players.push @symbol

    analyze_vector_as = (symbol, start_x, start_y, dx, dy)->
      distance = 0
      result = 0

      while distance < size
        x = start_x + dx * distance
        y = start_y + dy * distance
        
        if not board_grid[x][y]
          result +=1
        else if board_grid[x][y] is symbol
          result +=3
        else
          return 0

        distance++  

      if result == ((size-1) * 3 + 1) # this vector is potential win, i.e. size-1 items were found
        result *= 3
      

      result  

    analyze_point_as = (symbol, x, y) ->
      result = 0
      result += analyze_vector_as(symbol, 0, y, 1, 0)
      result += analyze_vector_as(symbol, x, 0, 0, 1)
      if x == y
        result += analyze_vector_as(symbol, 0, 0, 1, 1)
      if (x + y) == (size - 1)
        result += analyze_vector_as(symbol, size-1, 0, -1, 1)

      result

    analyze_point = (x, y) ->
      result = 0
      for symbol in players
        result = Math.max result, analyze_point_as(symbol, x, y)

      result

    max_value = -1    
    for move in possible_moves
      if (value = analyze_point(move[0], move[1])) > max_value
        [@x, @y] = move
        max_value = value

    @attempt_move()

class Game

  @possible_types: [
    'hotseat'
    'you vs chaos'
    'you vs pc'
  ]
  
  @possible_players: "xo"

  constructor: (board_size, game_type)->
    throw Error "game_type must be one of" + Game.possible_types.join(', ') unless game_type in Game.possible_types

    board_size = parseInt board_size, 10

    throw Error "board_size must be positive integer" unless board_size > 0

    @finished = false
    @board = new Board board_size
    @type = game_type

    @players = []
    @active_player_index = -1
    @active_player = null
    @winner = undefined
    
    @moves = []

    @fill_players()

  

  fill_players: (game_type)->
    # TODO initialize players according to type of game

    available_symbols = Game.possible_players.split ''

    move_handler = ((move)=>@accept_move(move))

    next_random_symbol = ()->
      available_symbols.splice(getRandomInt(0, available_symbols.length-1), 1)[0]

    switch @type
      when 'hotseat'
        while available_symbols.length > 0
          @players.push(new LocalPlayer(next_random_symbol(), move_handler))

      when 'you vs chaos'
        @players.push(new LocalPlayer(next_random_symbol(), move_handler))
        while available_symbols.length > 0
          @players.push(new AIPlayerChaosMonkey(next_random_symbol(), move_handler))

      when 'you vs pc'
        @players.push(new LocalPlayer(next_random_symbol(), move_handler))
        while available_symbols.length > 0
          @players.push(new AIPlayerMinMax(next_random_symbol(), move_handler))
          

    @start_game()

    return @players
  
  start_game: ->
    if @players.length < 2 then throw Error "not enough players to start"
    @started = (new Date()).getTime()
    @next_move()


  onmoveaccepted: undefined  
  accept_move: (move)->
    unless @finished
      if (move.symbol?) and (move.x?) and (move.y?)
        if move.symbol is @active_player.symbol
          # TODO handle the resigns
          if @board.add_move(move.symbol, move.x, move.y)
            @moves.push {
              at: (new Date()).getTime()
              symbol: move.symbol
              x: move.x
              y: move.y
            }

            if @board.check_win move.symbol
              @finished = true
              @winner = move.symbol 
            else if @board.check_full()
              @finished = true
              @winner = undefined
            else
              @next_move()

            if @onmoveaccepted? and typeof @onmoveaccepted is 'function' then @onmoveaccepted()  

            @board.grid


    

  next_player: ->
    if @players.length > 0
      @active_player_index = ++@active_player_index % @players.length
      @active_player = @players[@active_player_index]

  next_move: ->
    setTimeout (=> @next_player().move(@board.grid)), 0


angular.module('asArtApp')
  .controller 'GameCtrl', ($scope)->

    $scope.game_types = Game.possible_types

    $scope.create_new_game = ()->
      $scope.game = new Game $scope.new_game.size, $scope.new_game.type
      $scope.game.onmoveaccepted = ()->
        $scope.$apply()

    $scope.local_player_move = (x, y)->
      if $scope.game? and $scope.game.active_player.accepts_clicks
        $scope.game.active_player.x = x
        $scope.game.active_player.y = y
        $scope.game.active_player.attempt_move()
