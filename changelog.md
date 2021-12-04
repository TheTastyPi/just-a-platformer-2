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

### 4 Dec. 2021

- Added a button that toggles animations