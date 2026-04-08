# PJ2 Phase 1 Key UML

This diagram keeps only the key classes/modules in the current `feature/pj2-phase1` implementation.

```mermaid
classDiagram
  direction LR

  class FrontendApp {
    <<TypeScript main.ts>>
    +createRoom()
    +joinRoom()
    +startGame()
    +commitSetup()
    +queueOrder()
    +commitTurn()
    +render()
    +drawBoard()
  }

  class Pj2Orders {
    <<TypeScript module>>
    +techUpgradeCost()
    +unitUpgradeCost()
    +canUpgradeUnit()
  }

  class TerritoryIntel {
    <<TypeScript module>>
    +summarizeTerritoryIntel()
  }

  class RoomController {
    <<RestController>>
    +createRoom()
    +joinRoom()
    +viewRoom()
    +startRoom()
    +setup()
    +turn()
  }

  class RoomService {
    <<Service>>
    +createRoom()
    +joinRoom()
    +viewRoom()
    +startRoom()
    +commitSetup()
    +commitTurn()
  }

  class GameRoom {
    <<RoomService inner class>>
    -GameEngine engine
    +view()
    +start()
    +commitSetup()
    +commitTurn()
  }

  class GameEngine {
    <<Core domain>>
    +commitPlacement()
    +startOrdersPhase()
    +validateOrders()
    +resolveCommittedTurn()
    +view()
  }

  class MapGenerator {
    <<Utility>>
    +generate()
  }

  class TerritoryDefinition {
    <<record>>
    +name
    +initialOwner
    +size
    +resourceProduction
    +neighbors
    +polygon
  }

  class TerritoryState {
    +owner
    +unitCounts
    +units()
    +addUnits()
    +removeUnits()
  }

  class OrderCommand {
    <<record>>
    +type
    +source
    +target
    +units
    +playerId
    +fromLevel
    +toLevel
  }

  class GameView {
    <<DTO>>
    +phase
    +territories
    +players
    +lastLog
    +turnNumber
    +waitingOnPlayers
  }

  class TerritoryView {
    <<DTO>>
    +name
    +owner
    +units
    +size
    +resourceProduction
    +unitCounts
    +neighbors
    +polygon
  }

  class PlayerView {
    <<DTO>>
    +id
    +territories
    +totalUnits
    +reserveUnits
    +maxTechnologyLevel
    +resources
  }

  class TurnRequest {
    <<DTO>>
    +orders
  }

  class PlacementRequest {
    <<DTO>>
    +allocations
    +abandon
  }

  FrontendApp ..> RoomController : HTTP /api/rooms
  FrontendApp --> Pj2Orders
  FrontendApp --> TerritoryIntel
  FrontendApp ..> GameView

  RoomController --> RoomService
  RoomService *-- GameRoom
  GameRoom o-- GameEngine
  GameRoom --> PlacementRequest
  GameRoom --> TurnRequest
  GameRoom --> GameView

  GameEngine --> MapGenerator
  GameEngine *-- TerritoryState
  GameEngine o-- TerritoryDefinition
  GameEngine --> OrderCommand
  GameEngine --> GameView

  MapGenerator --> TerritoryDefinition
  TerritoryState --> TerritoryDefinition

  GameView --> TerritoryView
  GameView --> PlayerView
  TurnRequest --> OrderCommand
```

## Key Flow

`FrontendApp -> RoomController -> RoomService -> GameRoom -> GameEngine`

`GameEngine` is the core rule engine. It owns setup placement, order validation, resource costs, upgrades, combat resolution, reinforcements, and view generation.
