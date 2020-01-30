import ScanditCaptureCore

struct BlockingListenerCallbackResult: Decodable {
    struct ResultJSON: Decodable {
        enum CodingKeys: String, CodingKey {
            case enabled
            case brushJSONString = "brush"
        }

        let enabled: Bool?
        let brushJSONString: String?
    }

    let finishCallbackID: ListenerEvent.Name
    let result: ResultJSON

    var enabled: Bool? {
        return result.enabled
    }

    var brush: Brush? {
        guard let jsonString = result.brushJSONString else {
            return nil
        }

        return Brush(jsonString: jsonString)
    }

    static func from(_ command: CDVInvokedUrlCommand) -> BlockingListenerCallbackResult? {
        guard let data = command.defaultArgumentAsString?.data(using: .utf8) else {
            return nil
        }
        let decoder = JSONDecoder()
        return try? decoder.decode(BlockingListenerCallbackResult.self, from: data)
    }

    func isForListenerEvent(_ listenerEventName: ListenerEvent.Name) -> Bool {
        return finishCallbackID == listenerEventName
    }
}
