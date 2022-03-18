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
