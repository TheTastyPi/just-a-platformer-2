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

- Added help menu, accessable by \[H].
