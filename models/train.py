from ultralytics import YOLO



model = YOLO('ultralytics/cfg/models/v12/yolov12-seg.yaml')

results = model.train(
  data=r'pathfinders-2/data.yaml',
  
  epochs=30,  
  patience=50,  
  
  batch=8,  
  imgsz=640,  
  
  scale=0.5,       
  mosaic=1.0,      
  mixup=0.15,      
  copy_paste=0.3, 
  flipud=0.0,      
  fliplr=0.5,      
  degrees=10.0,   
  translate=0.1,  
  
  device="0",
  optimizer='AdamW', 
  lr0=0.001,      
  lrf=0.01,     
  
  weight_decay=0.0005,
  dropout=0.0,     
  
  save=True,
  save_period=25,  
  plots=True,
  val=True,
  
  cache='ram',  
  workers=4,    
  
  name='footpath_segmentation',
  exist_ok=True,
  
  
  amp=True,  
  
  
  close_mosaic=10,
)

print("\n" + "="*50)
print("VALIDATION RESULTS:")
print("="*50)
metrics = model.val()

print(f"\nSegmentation mAP@0.5: {metrics.seg.map50:.4f}")
print(f"Segmentation mAP@0.5:0.95: {metrics.seg.map:.4f}")
print(f"Box mAP@0.5: {metrics.box.map50:.4f}")
print(f"Box mAP@0.5:0.95: {metrics.box.map:.4f}")



