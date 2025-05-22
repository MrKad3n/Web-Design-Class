@Controller
@RequestMapping("/assets")
public class AssetController {
    
    @GetMapping("/images/{type}/{name}")
    public ResponseEntity<Resource> getImage(
            @PathVariable String type, 
            @PathVariable String name) {
        
        String path = "static/" + type + "/" + name;
        Resource resource = new ClassPathResource(path);
        
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(resource);
    }
}