import React, { useLayoutEffect } from 'react';
import {DrawingBoardContext, DrawingBoardContextProps,} from '../providers/DrawingBoardProvider';

const DrawingBoard: React.FC = (props) => {
  const context = React.useContext(
    DrawingBoardContext
  ) as DrawingBoardContextProps;
  const ref = React.useRef<HTMLCanvasElement>(null);
    //create canvas element and populate canvas
  useLayoutEffect(() => {
    const canvas = ref.current as HTMLCanvasElement;
    canvas.height = 600;
    canvas.width = 850;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.lineWidth = context.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    context.setCtx(ctx);
  }, []);

  return (
    <canvas
      ref={ref}
      onMouseDown={context.handleMouseDown}
      onMouseUp={context.handleMouseUp}
      onMouseMove={context.handleMouseMove}
    ></canvas>
  );
};
export default DrawingBoard;
