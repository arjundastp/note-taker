import {
  Canvas,
  Image as SkiaImage,
  Path,
  Skia,
  useCanvasRef,
  type SkImage,
  type SkPath,
  type SkPathBuilder,
} from "@shopify/react-native-skia";
import { forwardRef, useImperativeHandle, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { theme } from "../lib/theme";

interface Stroke {
  builder: SkPathBuilder; // mutable; path is its current snapshot for rendering
  path: SkPath;
  color: string;
  width: number;
}

export interface SketchHandle {
  snapshotPng: () => Uint8Array | null;
  undo: () => void;
  clear: () => void;
}

interface Props {
  tool: "pen" | "eraser";
  background: SkImage | null; // existing sketch to draw over
}

const PEN = { color: theme.ink, width: 3 };
const ERASER = { color: "#FFFFFF", width: 24 };

export const SketchCanvas = forwardRef<SketchHandle, Props>(function SketchCanvas(
  { tool, background },
  ref,
) {
  const canvasRef = useCanvasRef();
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<Stroke | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useImperativeHandle(ref, () => ({
    snapshotPng: () => {
      const image = canvasRef.current?.makeImageSnapshot();
      return image ? new Uint8Array(image.encodeToBytes()) : null;
    },
    undo: () => setStrokes((p) => p.slice(0, -1)),
    clear: () => setStrokes([]),
  }));

  // runOnJS so the gesture can update React state directly.
  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin((e) => {
      const builder = Skia.PathBuilder.Make();
      builder.moveTo(e.x, e.y);
      setCurrent({ builder, path: builder.build(), ...(tool === "eraser" ? ERASER : PEN) });
    })
    .onUpdate((e) => {
      setCurrent((s) => {
        if (!s) return s;
        s.builder.lineTo(e.x, e.y);
        return { ...s, path: s.builder.build() }; // new ref so React re-renders
      });
    })
    .onEnd(() => {
      setCurrent((s) => {
        if (s) setStrokes((prev) => [...prev, s]);
        return null;
      });
    });

  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.fill} onLayout={onLayout}>
        <Canvas ref={canvasRef} style={styles.fill}>
          {background && size.w > 0 && (
            <SkiaImage
              image={background}
              x={0}
              y={0}
              width={size.w}
              height={size.h}
              fit="contain"
            />
          )}
          {strokes.map((s, i) => (
            <Path
              key={i}
              path={s.path}
              color={s.color}
              style="stroke"
              strokeWidth={s.width}
              strokeCap="round"
              strokeJoin="round"
            />
          ))}
          {current && (
            <Path
              path={current.path}
              color={current.color}
              style="stroke"
              strokeWidth={current.width}
              strokeCap="round"
              strokeJoin="round"
            />
          )}
        </Canvas>
      </View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#FFFFFF" },
});
