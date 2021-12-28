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