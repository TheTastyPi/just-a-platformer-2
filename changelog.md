# Change Log

## 4 Nov. 2021

- Made the jap2 editor public!
- Changes from jap1:
  - Block positions are no longer constrained by a grid
  - Blocks can now be any size from 50px to 6.25px
  - Blocks can be stacked on top of each other
  - You can select a group of blocks and:
    - Delete
    - Move
    - Scale
    - Edit Properties
    - Cut/Copy/Paste
  - The UI has been altered significantly
  - The code is slightly more organized
  - Probably some other things I forgot

### 6 Nov. 2021

- Fixed a bug where event priority does not differentiate between directional events
- Added the "giveJump" property to blocks, which determine whether they give you jumps when you touch them
- Refactored the shit out of collision

### 7 Nov. 2021

- Made isSolid an editable property of blocks
- Added floorLeniency property to blocks

### 9 Nov. 2021

- Changed the appearance of Death Block and Bounce Block
- Now when you try to move blocks without having one selected, it'll automatically select a single block.

### 10 Nov. 2021

- Added ability to move camera with \[shift] \[ctrl] Ldrag
- Refocus camera with \[shift] \[ctrl] RMB

### 12 Nov. 2021

- Added ability to zoom in/out with \[shift] \[ctrl] Scroll
- Reset zoom with \[shift] \[ctrl] MMB

### 15 Nov. 2021

- Added help menu, accessible by \[H].

## 3 Dec. 2021

- Added 5 new blocks
  - Pushable Block
  - Unpushable Block
  - Ice Block
  - Water Block
  - Conveyor Block
- Added "dynamic" property to blocks
  - Added several properties for dynamic blocks
    - xv, yv, g, xg, pushable, invincible
  - Added Play Mode: Dynamic blocks are active, but you can't edit
- Added "opacity" property to blocks
- Added "friction" property to blocks
- Added three frames of coyote time
- The physics now runs at a constant time interval
- The block edit menu no longer closes if you have an input element in focus
- Setting start point now also saves the level
- God mode now has infinite jump
- Block edit menu now updates as you move or scale selected blocks

### 3 Dec. 2021 #2

- Now when editing a block's type, the block is automatically set to the default block of the new type

### 4 Dec. 2021

- Fixed a bug where adding dynamic blocks couldn't be undo after activating play mode

### 4 Dec. 2021 #2

- Added a button that toggles animations

### 4 Dec. 2021 #3

- Animations no longer cause memory leak

## 9 Dec. 2021

- Added 2 blocks
  - Gravity Field
  - Speed Field
- Added "temporary" property to the two blocks above
  - This means the effects of the object is only in effect when touching the object
- Fixed a bug where copying and pasting blocks with custom textures caused the game to crash
- Fixed a bug where property limits just, didn't work
- Fixed a bug where respawning after deleting saved dynamic blocks caused them to reappear
- Fixed a bug where the background incorrectly scales when zooming in/out
- Added an easter egg

### 10 Dec. 2021

- Major performance upgrade
- Fixed a bug where the god mode button doesn't work
- Fixed a bug where dynamic objects disappear after respawning
- Fixed a bug where dynamic objects behaves weirdly after changing level size

### 11 Dec. 2021

- Added Text Field
- Removed strictPriority, since there wasn't much use for it
- The UI has been changed significantly
- Added a text field to the default level

### 12 Dec. 2021

- Check Points now display "SHFT" when the player collides with them
- Fixed a bug where undoing a paste involving multiple blocks in the same grid space caused the game to crash
- Fixed a bug where, after undoing and redoing the placement of a dynamic block and entering and exiting play mode, undoing the placement again causes the game to crash
- Fixed a bug where the start position doesn't move along with level expansion
- Fixed a bug where removing dynamic blocks by retracting level size causes the game to crash upon entering play mode
- Fixed a bug where blocks can be positioned out-of-bound after retracting level size
- You can now redo using \[ctrl] \[Y] instead of \[ctrl] \[shift] \[Z] (happy?)

### 18 Dec. 2021

- Significantly changed dynamic block handling
  - This fixed several issues with velocity handling on collision
  - May break some levels, sorry :(
- Added the "crushPlayer" property to dynamic blocks
- You can no longer get crushed by stationary blocks
- Fixed a bug where friction didn't work with xg as true
- Fixed a bug where the player or a dynamic obj can gain infinite acceleration
- Dynamic conveyor blocks are now more dynamic
- Added Force Field

### 20 Dec. 2021

- Optimizations
- Added the ability to place multiple grid-aligned blocks at once using \[shift] LDrag

#### 21 Dec. 2021

- Fixed a bug where shit goes very wrong

## 24 Dec. 2021

- Added Jump Field, Jump Restore Field, and Wall-Jump Block

#### 24 Dec. 2021 #2

- Fixed a bug where Force Block with addVel true doesn't work

## 25 Dec. 2021

- Added several Panels (Solid, Death, Bounce, Wall-Jump, Ice, Conveyor)

#### 25 Dec. 2021 #2

- Fixed a bug where the "invisible" property doesn't work
- Fixed a bug where the grid display extends beyond the level

### 27 Dec. 2021

- Optimizations, again
  - Now the 'world' port from jap1 runs smooth on my device
- Raised the block size limit to 100

### 28 Dec. 2021

- Optimizations, again, again
  - Specifically for dynamic block
- Fixed a bug where you can select block by interacting with the side menus

#### 28 Dec. 2021 #2

- Fixed a bug where the removal of animated blocks weren't handled properly
- Fixed a bug where saving while interacting with a dynamic block and respawning causes the game to crash

#### 28 Dec. 2021 #3

- You can now control the camera while in play mode
- You can no longer save the "dead" state
- You now undie when you teleport the player using \[ctrl] LMB
- Objects can no longer die when a panel is inside of it

#### 28 Dec. 2021 #4

- Fixed a bug where scaling selected block doesn't update the selection display
- Fixed a bug where dynamic objects does not save post-death after being moved, scaled, or property changed without going into play mode
- The camera no longer resets position when you change level size

#### 30 Dec. 2021

- Fixed a bug where Check Point texture does not change after saving
- Fixed a bug where (un)culling is not performed on dynamic objects exiting/entering the screen

### 31 Dec. 2021

- Optimization, again, again, again
  - This time it's conveyor objects
- Fixed a bug where you can't scale block above size 50 by scrolling
- Fixed a bug where you sometimes can't select a block over size 50
- Fixed a bug where removing blocks via undo/redo can cause the game to crash

## 16 Jan. 2022

- Added rooms
  - Access room controls through the 'rooms' tab beside 'saves'
  - Controls similar to saves
  - Dynamic blocks are only active if the player is in the same room or is connected to it by a Boundary Warp (listed below)
- Added Teleporter
  - Select teleport position using Ctrl LMB
- Added Boundary Warp
  - Connects two rooms by their boundaries
    - Will connect to another Boundary Warp according to the selected room, id, and target id
  - Can transport both the player and dynamic blocks
  - It cannot connect two directions at once
  - The "forceVert" property forces it to point vertically when at a corner
- Added the "alwaysActive" property
  - Makes it so that the block is always active regardless of the player's current room
- Made eventPriority impact the layering of the block's display
- Added a display for manually teleporting the player
  - Applies for Teleporter selection too
- Manual teleportation of the player is now affected by grid snap options
- You can now confirm property edit by pressing Enter
  - Dunno why I didn't do this sooner
- Fixed a bug where you cannot full jump out of water consistently
- Fixed a bug where canceling renaming a save after adding a save with a duplicate name causes a save with an empty name to be created
- Fixed a bug where moving the camera while zoomed in/out does not correctly cull surrounding blocks
- Fixed a bug where deleting a Check Point while the player is touching it causes the game to crash

### 17 Jan. 2022

- Dynamic objects (including the player) now dies if fully inside a block
- Dynamic blocks no longer die if the player is inside of them
- All dynamic blocks are now centered after using a Teleporter
- Fixed a bug where respawning after a dynamic block interacts with a Teleporter causes the game to crash

#### 17 Jan. 2022 #2

- Fixed screen transitions, which were supposed to be in the game, but no one noticed since it didn't exist in jap1

#### 18 Jan. 2022

- Fixed a bug where selecting a Jump Restore Field causes an error

#### 19 Jan. 2022

- Changed Boundary Warp's default eventPriority to 3

## 27 Jan. 2022

- Added Size Field
  - Works on dynamic blocks too!
- Improved player/dynamic objects crushing detection

#### 28 Jan. 2022

- Fixed a bug where the manual teleportation display does not work on Mac
- Changed Force Field default 'friction' to true

#### 31 Jan. 2022

- Fixed a bug where coyote time still applies after switching gravity

## 10 Feb. 2022

- Added Switch
  - Switches only affect the room they're in
  - Added 'global' property
  - Can be toggled by dynamic blocks
- Added Switch Block
  - Set BlockA and BlockB property by pressing the button then selecting a block
  - Can contain dynamic blocks
- Added 'color' property to Death Block, Pushable Block, and Unpushable Block
- Bounce Block now changes color based on 'power' property
- Fixed a bug where you get an error when reselecting or editing the properties of a Jump Restore Field
- Fixed a bug where editing two block of different types at once caused the game to crash
- Fixed a bug where certain player properties does not save across loads

### 11 Feb. 2022

- Fixed a bug where levels with Switch Block containing an empty block slot cannot load properly

### 11 Feb. 2022 #2

- Pasting blocks from one room to another now works
- Fixed a bug where respawning/restarting after renaming a room without setting your spawn/startpoint crashes the game
- Fixed a visual bug with Switch Block of different sizes
- Fixed a bug where changing the size of a block using the scroll wheel does not change their targetSize
- Fixed a visual bug with dynamic blocks crossing a boundary warp
- Fixed a bug where dynamic objects cannot interactive with a dynamic block across a boundary warp

### 13 Feb. 2022

- Fixed a bug where Switch Blocks containing dynamic blocks with alwaysActive true are not always active
- Fixed a bug where respawning or toggling play mode after a dynamic Switch Block exits the screen via a boundary warp causes the game to crash
- Fixed a bug where weird shit goes down when a Switch Block does anything with a boundary warp
- Fixed a bug where dynamic blocks with 'pushable' false can still be pushed when across a boundary warp
- Fixed a bug where dynamic blocks with 'alwaysActive' false abruptly disappear when going through a boundary warp the player is not interacting with
- Fixed a bug where having Switch Blocks in a level may cause dynamic blocks to not reset properly on respawn/restart
- Fixed a visual issue where scaled Switch Blocks does not display correctly after a respawn or toggling play mode
- Bounce Panels now also changes color like Bounce Blocks
- Solid Panels and Death Panels now has the 'color' property like their block counterpart
- Fixed a bug where the player doesn't move while standing on a moving Switch Block

### 14 Feb. 2022

- Fixed a bug where the player moves while on a non-dynamic, non-moving block with a non-zero velocity
- Fixed a bug where if you create a new room while in a room with dynamic Switch Blocks or animated block, then the new room's copy of those blocks will not have the appropriate properties
- Export code no longer has backslashes in them so that Discord won't break them (don't worry, previous codes still work)

#### 16 Feb. 2022

- Fixed a bug where Teleporters crashes the game when their destination doesn't exist
- Added 'color' property to Check Points, cuz why the hell not
- Fixed a bug where blocks peeking out from beyond a Boundary Warp does not display properly

### 19 Feb. 2022

- Redesigned the visual of all Panels
- Added the 'color' property to Wall-Jump Blocks, Wall-Jump Panels, Ice Blocks, and Ice Panels
- Fixed a bug where after wall-jumping you can still do a buffered jump

### 19 Feb. 2022 #2

- Fixed a bug where a Force Field with 'friction' false will not work if the affected object is not touching a block with 'friction' true
- Actually removed backslashes from export code

### 19 Feb. 2022 #3

- Fixed a bug where pasting blocks outside the current room causes the game to crash
- Refactored the code a tiny bit

#### 21 Feb. 2022

- Fixed a bug where you can't jump for the first input after sliding off a Wall-Jump Block/Panel
- Fixed a bug where levels can load incorrectly

## 24 Feb. 2022

- Added Jump Block
- Added a border to Switch Blocks to match Jump Blocks
- Fixed a bug where the player can sometimes wall-jump by walking off a Wall-Jump Block
- Minor optimizations

### 26 Feb. 2022

- Added the ability to cancel out of sub-block selection with Esc
- Added the ability to copy a sub-block (while in sub-block selecting) using Ctrl-C

## 4 Mar. 2022

- Added Unstable Block, Coin, and Coin Block
- The level size editing UI now also shows the level size
- Readded 'id' and 'global' property to Switch Block because I accidentally removed them like an idiot
- Coveyor Blocks and Force Fields with 'addVel' true can now move you in the same axis as your gravity.
- Fixed a bug where Jump Restore Fields stop working after editing its properties while it's cooling down
- Fixed a bug where the game crashes under certain conditions related to having multiple multi-state blocks in a single gridspace
- Fixed a bug where Jump Blocks doesn't reset properly after respawning
- Fixed a bug where the level sometimes does not display correctly after changing level size

#### 5 Mar. 2022

- Fixed a bug where loading a level with a Boundary Warp that doesn't lead anywhere crashes the game

### 5 Mar. 2022 #2

- Optimized Text Blocks

### 8 Mar. 2022

- Optimized Switches and Switch Blocks
- Fixed a bug where the game just crashes for some reason (probably some circular refrence thing idk)
- Fixed a bug where dynamic block's limit on velocity didn't work
- Fixed a bug where after pasting from clipboard, the property edit menu won't update according to the selected blocks
- Fixed a bug where the game crashes if you deactive play mode after moving a dynamic block to another room and then respawn
- Fixed a bug where you can't use MMB to select a bulding block from a block you've already selected in edit mode
- Fixed a bug where dynamic Switches, Unstable Blocks, and Coins doesn't work

### 10 Mar. 2022

- Added the ability to link and unlink blocks.
  - Linked blocks are selected as a group

### 11 Mar. 2022

- Fixed a bug where everything goes wrong when you save

### 13 Mar. 2022

- Fixed a bug where transparent blocks do not display properly across boundary warps
- Fixed a bug where the game crashes if a block not being displayed was being attempted to be updated

### 13 Mar. 2022 #2

- Added the passOnPush property to all Panels

### 13 Mar. 2022 #3

- Added the collidePlayer and collideBlock property to all blocks
- The pushable property has been renamed to playerPushable
- Added the blockPushable property to all dynamic blocks
- Unpushable Block has been renamed to Semi-Unpushable Block
- Added Unpushable Block, which has both playerPushable and blockPushable as false

### 15 Mar. 2022

- Fixed a bug where the level size display doesn't update properly
- Fixed a bug where a blank block on the blockB property of multi-state blocks does not save properly
- Fixed a bug where checkpoints can display incorrectly when put in different rooms
- Fixed a bug where the game crashes if you load a level after changing the state of the level

### 17 Mar. 2022

- Fixed a bug where state-changing blocks' display doesn't update properly after exiting and re-entering its room
  - Nor after toggling play mode
- Fixed a couple bugs where restarting from a checkpoint saved after the state of the level causes weird behaviors
- Fixed a couple bugs related to importing

### 17 Mar. 2022 #2

- Portal location selection is now affected by grid snapping

### 17 Mar. 2022 #3

- Added hideDetails property to all toggleable blocks

### 18 Mar. 2022

- Pasting is now affected by grid snapping

### 19 Mar. 2022

- Added small descriptions to certain block properties that are available on hover
- Fixed a bug where nested switch blocks doesn't update properly
- Fixed a bug where checkpoints as sub-blocks doesn't update properly

### 20 Mar. 2022

- Fixed a bug where sub-block's touch events does not peform properly

### 23 Mar. 2022

- Switch Blocks are now more optimized

### 24 Mar. 2022

- Added the ability to rotate 90 degrees and flip selected blocks
- Fixed several issues related to undoing and redoing, like seriously, how have you people not reported this yet, and how have I not found this until now

### 25 Mar. 2022

- Fixed a bug where undo/redoing rotations and flips didn't work if the targeted blocks weren't selected

### 25 Mar. 2022 #2

- Fixed a bug where blocks deleted via deleting a room are still selected
- Fixed a bug where, while not in play mode, selected dynamic blocks are bugged after respawning
- Fixed a bug where rotating blocks can cause long decimals after the positions of a block
- Property edit display now updates as you scale a block

## 30 Mar. 2022

- Added dashing (Q or L)
- Added Dash Field and Dash Restore Field
- Fixed the display of Jump Field and Jump Restore Field when newJump or addedJump is 0
- Fixed a bug where properties with a value of Infinity does not save properly
- Fixed a bug where dynamic blocks does not interact with Wall-Jump Blocks correctly
- Force Fields with addVel false now disables acceleration via other sources
- Added a description for the "addVel" property of Force Fields

### 31 Mar. 2022

- Changed the look of Dash Restore Fields when cooling down
- Wall-jumping now take priority over normal jumps if the player is not on the floor

## 20 Jul. 2022

- Added events
  - Allows one to write a 'script' that can interact with the level and player
  - Read the in-game documentation for more info
  - Added 'Event Clear' block along with this
- Added 'color' property to Teleporters
- Added 'color' and 'hideDetails' property to Switch
  - Changed the display of global and used switches as a result
- Added a description to 'passOnPush'
- Links are now saved along with level data
- Removed Check Point's "SHFT" display and replaced it with normal text
- Block states now also saves out of play mode
- Slightly optimized multi-state blocks
- All non-solid blocks' default eventPriority are now 3
- You can no longer select non-input texts
- Teleporting to another room now instantly sets the camera position
- You can now set eventPriority to negative numbers
  - z-index of blocks are equal to eventPriority, and the player has z-index of -1, so now you can have blocks in the background
- Fixed some bugs where:
  - Velocity-on-collision of multi-state blocks are retained even when they're turned static
  - The game sometime crashes on respawn for reasons related to multi-state blocks
  - Sometimes wall-jumping doesn't work
  - Editing properties of linked blocks doesn't work
  - The player can start in the wrong room on load
  - Text Field's text position doesn't respect the in-game zoom
  - You can jump after respawning on a solid block with giveJump false
  - Deleting or renaming the room the player's in crashes the game if the player is touching a non-solid block
  - Textures are incorrectly updated after rotating/flipping
  - Jump/Dash Restore Field and Unstable Block states are not saved/reverted
  - Respawning after changing the state of blocks across a Boundary Warp crashes the game
  - Blocks can desync from the mouse position when moving them
  - Pasting blocks while zoomed in/out behaves weirdly
  - Touching multiple Text Fields in succession doesn't display subsequent text
  - Teleporting across rooms doesn't work
- Refactored a bunch of code (seriously)
- Probably a whole bunch of other things I forgot to write here

### 25 Jul. 2022

- Fixed a bug where levels with blocks that has properties of type 'block' doesn't save/load properly
- Fixed a bug where editing properties of type 'block' can have weird behavior

### 26 Jul. 2022

- Fixed a bug where deleting blocks while moved by a command can crash the game

#### 26 Jul. 2022 #2

- Text now displays based on target camera position instead of current camera position

### 31 Jul. 2022

- Broken block references in events now reconnect after saving

### 31 Jul. 2022 #2

- Block references now no longer breaks after deleting blocks and undoing it
- Fixed a bug where undo/redoing event edits with self-reference crashes the game

#### 1 Aug. 2022

- Fixed a bug where non-integer grid size does not display properly

### 2 Aug. 2022

- You can now move blocks outside the room boundary via property editing.

### 4 Aug. 2022

- Fixed a bug where level with subblocks from previous versions did not load properly

### 8 Aug. 2022

- Fixed a bug where the game doesn't work on Safari
- Fixed a bug where saving with a partially deleted block reference can cause the level to corrupt on save

### 12 Aug. 2022

- Fixed a bug where dashing causes dynamic block velocity to become static
- Fixed a bug where dynamic blocks can spontaneously clip through blocks

### 13 Aug. 2022

- Fixed a visual bug related to deleting the room the player is in
- Fixed a bug where you can respawn to a deleted room and crash the game
- Fixed a bug where you can rename a room to have the same name as another room

### 19 Aug. 2022

- Added two new commands: log() and err()

### 23 Aug. 2022

- Fixed a bug where sub-blocks didn't get compressed properly when saving

### 24 Aug. 2022

- Improved how wall sliding on wall-jump blocks is handled

### 26 Aug. 2022

- Added the 'color' property to Switch Blocks

#### 27 Aug. 2022

- Fixed a bug where text doesn't properly display after panning the camera.

### 31 Aug. 2022

- Heavily reorganized the code

### 1 Sep. 2022

- Fixed a bug where an object can clip into a block's corner in very precise circumstances.

## 5 Sep. 2022

- Added an options menu in the main page of jap2, which has options for:
  - Dark theme
  - Custom BG Color
  - Custom keybinds
    - There are some presets:
    - Type A, new default. Z or Period to jump, X or Comma to dash
    - Type B, same as before. Directional key to jump, but still X or Comma to dash
  - Default autosave in editor
- Added a loading screen
- Added a more info button in the miscellaneous section
  - Allows you to go to the main page from the editor

#### 9 Sep. 2022

- Fixed a past version compatibility issue

### 10 Sep. 2022

- Added the 'zLayer' property to all blocks
  - If non-empty, overrides the zLayer set by eventPriority
- Fixed a bug where you can set a property to the wrong type
  - Dunno why this wasn't fixed earlier

### 12 Sep. 2022

- Fixed a bug where the bugfix from two versions ago broke the game

### 17 Sep. 2022

- Added tabs to the block selection
- Made a few changes to the looks of the UI
  - Fixed some inconsistencies with appearances across browsers

#### 20 Sep. 2022

- Fixed some issues with dark mode in the console and links in the japascript documentation
- Updated documentation with log() and err()

### 29 Sep. 2022

- Fixed a bug where you can't open the main menu while in dark mode (how has no one found this)
- Fixed a bug where the tab icon displayed in the main menu is incorrect

## 4 Oct. 2022

- Added view layers
  - Allows you to view and select certain parts of the level separately
  - Added the 'viewLayer' property to all blocks
- Heavily refactored the edit selection system
- When selecting a single block, you now always select the front-most block first
- Fixed selection dropdowns' dark mode visual
- Fixed a bug where dynamic wall-jump blocks/panels didn't work

### 5 Oct. 2022

- Added a base object to events: 'global'. Its properties are shared between every event.
- Fixed a bug where some block property can't be edited properly
- Fixed button styling in light theme on Safari