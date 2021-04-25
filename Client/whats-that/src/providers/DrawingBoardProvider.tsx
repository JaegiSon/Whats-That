import React, { useState } from 'react';
import Socket from '../components/Socket';
import { GameContextProps, GameContext } from './GameProvider';

type BoardEvent = React.MouseEvent<HTMLCanvasElement, MouseEvent>;


export interface DrawingBoardContextProps {
  isDrawing: boolean;
  setIsDrawing: (newVal: boolean) => void;
  handleMouseMove: (event: BoardEvent) => void;
  handleMouseUp: (event: BoardEvent) => void;
  handleMouseDown: (event: BoardEvent) => void;
  ctx: CanvasRenderingContext2D;
  setCtx: (ctx: CanvasRenderingContext2D) => void;
  color: string;
  brushSize: number;
}
export interface Line {
  x: number;
  y: number;
  color: string;
  brushSize: number;
  isEnding: boolean;
}

export const DrawingBoardContext = React.createContext<Partial<DrawingBoardContextProps>>({});

const DrawingBoardProvider: React.FC = (props) => {
  const context = React.useContext(GameContext) as GameContextProps;
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [ctx, setCtx] = React.useState<CanvasRenderingContext2D>();
  const color =('#000000');
  const brushSize = 7;
  const socket = Socket.getSocket();

  React.useEffect(() => {
    if (ctx) {
      socket.on('lineDraw', (line: Line) => {
        drawLine(line);
      });

      socket.on('drawStart', () => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);//clear canvas at start of new drawing
      });
    }
  }, [ctx]);

  const drawLine = (line: Line) => {
    if (!ctx) {
      return;
    }
    ctx.strokeStyle = line.color;
    ctx.lineWidth = line.brushSize;
    ctx.lineTo(line.x, line.y);
    ctx.stroke();
    if (line.isEnding) {
      ctx.beginPath();
    }
  };

  const draw = (event: BoardEvent, isEnding = false) => {
    if (!ctx || !isDrawing || !context.drawingPermission) {
      return;
    }
    const newLine = {
      x: event.clientX - ctx.canvas.offsetLeft,
      y: event.clientY - ctx.canvas.offsetTop,
      color,
      brushSize,
      isEnding,
    };
    drawLine(newLine);
    socket.emit('lineDraw', newLine);
  };
  const handleMouseMove = (event: BoardEvent): void => {
    draw(event);
  };
  const handleMouseDown = (event: BoardEvent): void => {
    setIsDrawing(true);
    draw(event);
  };
  const handleMouseUp = (event: BoardEvent): void => {
    draw(event, true);
    setIsDrawing(false);
  };

  return (
    <DrawingBoardContext.Provider
      value={{
        isDrawing,
        setIsDrawing,
        setCtx,
        ctx,
        handleMouseMove,
        handleMouseDown,
        handleMouseUp,
        color,
        brushSize,
      }}
    >
      {props.children}
    </DrawingBoardContext.Provider>
  );
};

export default DrawingBoardProvider;
